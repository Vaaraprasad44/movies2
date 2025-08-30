from fastapi import FastAPI, HTTPException, Query, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, RedirectResponse
from typing import List, Optional
from models import Movie, CreateMovieCommand, UpdateMovieCommand, MovieFilters, PaginatedMovieResponse, SignUpRequest, ParsedUserInfo, UserProfile
from database import db
from ai_parser import ai_parser
import math
import io
from PIL import Image
import pytesseract

app = FastAPI(title="AI Sign-Up API", version="v1", docs_url="/swagger", redoc_url="/redoc")
app.title = "AI Sign-Up API"
app.version = "v1"
app.description = "AI-powered sign-up API with natural language parsing. Users can enter all their information in one sentence and AI will parse it into structured data."

# Configure CORS to allow all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Send interactive user to swagger page by default
@app.get("/")
async def redirect_to_swagger():
    return RedirectResponse(url="/swagger")

def create_filters(
    search: Optional[str] = Query(None, description="Search in title, overview, cast, crew"),
    genres: Optional[List[str]] = Query(None, description="Filter by genre names"),
    year_from: Optional[int] = Query(None, description="Minimum release year"),
    year_to: Optional[int] = Query(None, description="Maximum release year"),
    rating_from: Optional[float] = Query(None, description="Minimum vote average"),
    rating_to: Optional[float] = Query(None, description="Maximum vote average"),
    runtime_from: Optional[int] = Query(None, description="Minimum runtime"),
    runtime_to: Optional[int] = Query(None, description="Maximum runtime"),
    language: Optional[str] = Query(None, description="Original language"),
    is_favorite: Optional[bool] = Query(None, description="Filter favorites"),
    personal_rating_from: Optional[float] = Query(None, description="Minimum personal rating"),
    personal_rating_to: Optional[float] = Query(None, description="Maximum personal rating"),
) -> MovieFilters:
    return MovieFilters(
        search=search,
        genres=genres,
        year_from=year_from,
        year_to=year_to,
        rating_from=rating_from,
        rating_to=rating_to,
        runtime_from=runtime_from,
        runtime_to=runtime_to,
        language=language,
        is_favorite=is_favorite,
        personal_rating_from=personal_rating_from,
        personal_rating_to=personal_rating_to,
    )

@app.get("/api/Movies", response_model=PaginatedMovieResponse, tags=["Movies"], operation_id="GetMovies")
async def get_movies(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
    filters: MovieFilters = Depends(create_filters)
):
    """Get paginated movies with optional filtering"""
    movies, total = db.get_movies_paginated(page=page, size=size, filters=filters)
    pages = math.ceil(total / size) if total > 0 else 1
    
    return PaginatedMovieResponse(
        items=movies,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@app.get("/api/Movies/search", response_model=PaginatedMovieResponse, tags=["Movies"], operation_id="SearchMovies")
async def search_movies(
    q: str = Query(..., description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
):
    """Search movies by title, overview, cast, or crew"""
    filters = MovieFilters(search=q)
    movies, total = db.get_movies_paginated(page=page, size=size, filters=filters)
    pages = math.ceil(total / size) if total > 0 else 1
    
    return PaginatedMovieResponse(
        items=movies,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@app.get("/api/Movies/favorites", response_model=PaginatedMovieResponse, tags=["Movies"], operation_id="GetFavoriteMovies")
async def get_favorite_movies(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
):
    """Get all favorite movies"""
    filters = MovieFilters(is_favorite=True)
    movies, total = db.get_movies_paginated(page=page, size=size, filters=filters)
    pages = math.ceil(total / size) if total > 0 else 1
    
    return PaginatedMovieResponse(
        items=movies,
        total=total,
        page=page,
        size=size,
        pages=pages
    )

@app.get("/api/Movies/{id}", response_model=Movie, tags=["Movies"], operation_id="GetMovie")
async def get_movie(id: int):
    """Get a specific movie by ID"""
    movie = db.get_movie_by_id(id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return movie

@app.post("/api/Movies", response_model=int, tags=["Movies"], operation_id="CreateMovie")
async def create_movie(command: CreateMovieCommand):
    """Create a new movie"""
    movie_id = db.create_movie(command)
    return movie_id

@app.put("/api/Movies/{id}", tags=["Movies"], operation_id="UpdateMovie")
async def update_movie(id: int, command: UpdateMovieCommand):
    """Update an existing movie"""
    success = db.update_movie(id, command)
    if not success:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    return Response(status_code=200)

@app.delete("/api/Movies/{id}", tags=["Movies"], operation_id="DeleteMovie")
async def delete_movie(id: int):
    """Delete a movie"""
    success = db.delete_movie(id)
    if not success:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    return Response(status_code=200)

@app.post("/api/Movies/{id}/favorite", tags=["Movies"], operation_id="ToggleFavorite")
async def toggle_favorite(id: int):
    """Toggle favorite status of a movie"""
    movie = db.get_movie_by_id(id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    update_command = UpdateMovieCommand(is_favorite=not movie.is_favorite)
    success = db.update_movie(id, update_command)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update movie")
    
    return {"is_favorite": not movie.is_favorite}


@app.get("/api/stats", tags=["Stats"], operation_id="GetStats")
async def get_stats():
    """Get database statistics"""
    all_movies, total_count = db.get_movies_paginated(page=1, size=99999)
    
    favorites_count = len([m for m in all_movies if m.is_favorite])
    rated_count = len([m for m in all_movies if m.personal_rating is not None])
    
    # Calculate genre distribution
    genre_counts = {}
    for movie in all_movies:
        for genre in movie.genres:
            genre_name = genre.get("name", "Unknown")
            genre_counts[genre_name] = genre_counts.get(genre_name, 0) + 1
    
    # Get top genres
    top_genres = sorted(genre_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    
    # Calculate year distribution
    year_counts = {}
    for movie in all_movies:
        if movie.release_date:
            try:
                year = int(movie.release_date.split("-")[0])
                decade = (year // 10) * 10
                year_counts[decade] = year_counts.get(decade, 0) + 1
            except (ValueError, IndexError):
                continue
    
    return {
        "total_movies": total_count,
        "favorites_count": favorites_count,
        "rated_count": rated_count,
        "top_genres": top_genres,
        "decade_distribution": sorted(year_counts.items())
    }


@app.post("/api/signup", response_model=UserProfile, tags=["SignUp"], operation_id="SignUpUser")
async def signup_user(request: SignUpRequest):
    """Sign up a new user by parsing their information from a single sentence"""
    try:
        # Parse user input using AI
        parsed_info = ai_parser.parse_user_info(request.user_input)
        
        # Create user in database
        user_id = db.create_user(parsed_info)
        
        # Return the created user profile
        user_profile = db.get_user_by_id(user_id)
        if not user_profile:
            raise HTTPException(status_code=500, detail="Failed to create user profile")
        
        return user_profile
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse user information: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@app.post("/api/signup/image", response_model=UserProfile, tags=["SignUp"], operation_id="SignUpUserWithImage")
async def signup_user_with_image(
    image: UploadFile = File(...),
    additional_text: Optional[str] = Form(None)
):
    """Sign up a new user by processing their ID card image with OCR and AI parsing"""
    try:
        # Validate file type
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image.")
        
        # Read image data
        image_data = await image.read()
        
        # Open image with PIL
        pil_image = Image.open(io.BytesIO(image_data))
        
        # Convert to RGB if necessary (for JPEG compatibility)
        if pil_image.mode != 'RGB':
            pil_image = pil_image.convert('RGB')
        
        # Extract text from image using OCR
        extracted_text = pytesseract.image_to_string(pil_image)
        
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="No text could be extracted from the image. Please ensure the ID is clear and readable.")
        
        # Combine extracted text with any additional text provided
        if additional_text and additional_text.strip():
            combined_text = f"{extracted_text.strip()} {additional_text.strip()}"
        else:
            combined_text = extracted_text.strip()
        
        print(f"Extracted text: {extracted_text[:200]}...")  # Log first 200 chars
        print(f"Combined text: {combined_text[:200]}...")
        
        # Parse the combined text using AI
        parsed_info = ai_parser.parse_user_info(combined_text)
        
        # Create user in database
        user_id = db.create_user(parsed_info)
        
        # Return the created user profile
        user_profile = db.get_user_by_id(user_id)
        if not user_profile:
            raise HTTPException(status_code=500, detail="Failed to create user profile")
        
        return user_profile
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process image: {str(e)}")


@app.get("/api/users", response_model=List[UserProfile], tags=["SignUp"], operation_id="GetAllUsers")
async def get_all_users():
    """Get all registered users"""
    return db.get_all_users()


@app.get("/api/users/{user_id}", response_model=UserProfile, tags=["SignUp"], operation_id="GetUser")
async def get_user(user_id: int):
    """Get a specific user by ID"""
    user = db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.delete("/api/users/{user_id}", tags=["SignUp"], operation_id="DeleteUser")
async def delete_user(user_id: int):
    """Delete a user by ID"""
    success = db.delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": f"User {user_id} deleted successfully"}