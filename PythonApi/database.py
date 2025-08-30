from typing import List, Optional, Dict, Any
from models import Movie, MovieFilters, CreateMovieCommand, UpdateMovieCommand, UserProfile, ParsedUserInfo
import threading
import pandas as pd
import json
import os
from pathlib import Path
import math
from datetime import datetime


class MovieDatabase:
    def __init__(self, csv_path: str = None):
        self._movies: List[Movie] = []
        self._users: List[UserProfile] = []
        self._next_movie_id = 1
        self._next_user_id = 1
        self._lock = threading.Lock()
        
        # Auto-detect which dataset to use
        if csv_path:
            self.csv_path = Path(csv_path)
        else:
            # Check if full dataset exists and has been set up
            full_dataset = Path("../Semantic_Recent.csv")
            sample_dataset = Path("../sample_movies.csv")
            
            if full_dataset.exists() and self._is_full_dataset(full_dataset):
                self.csv_path = full_dataset
                print("🎉 Using full dataset with 4800+ movies!")
            elif sample_dataset.exists():
                self.csv_path = sample_dataset
                print("📋 Using sample dataset. Run './setup-dataset.sh' to upgrade to full dataset.")
            else:
                self.csv_path = full_dataset  # Fallback
                print("⚠️  No dataset found. Please run './setup-dataset.sh' to set up the movie database.")
        
        self._loaded = False
        self._load_chunk_size = 200  # Process 200 rows at a time
        
        # Lazy load - only load when first requested
        print(f"MovieDatabase initialized. CSV will be loaded from {self.csv_path} on first request.")
    
    def _is_full_dataset(self, csv_path: Path) -> bool:
        """Check if the CSV file contains the full dataset (1000+ movies)"""
        try:
            with open(csv_path, 'r', encoding='latin-1') as f:
                line_count = sum(1 for line in f) - 1  # Subtract header
                return line_count >= 1000
        except Exception:
            return False
    
    def _ensure_loaded(self):
        """Ensure CSV is loaded (lazy loading)"""
        if self._loaded:
            return
            
        with self._lock:
            if self._loaded:  # Double-check pattern
                return
                
            try:
                self._load_from_csv_chunked()
                self._loaded = True
            except Exception as e:
                print(f"Error loading CSV: {e}")
                self._movies = []
                self._loaded = True  # Mark as loaded even if failed to prevent retries
    
    def _load_from_csv_chunked(self):
        """Load movies from CSV file in chunks to prevent timeouts"""
        if not self.csv_path.exists():
            print(f"CSV file not found at {self.csv_path}. Starting with empty database.")
            return
        
        print(f"Loading movies from {self.csv_path} in chunks...")
        
        # Try different encodings
        encodings = ['latin-1', 'utf-8', 'iso-8859-1', 'cp1252']
        encoding_used = None
        
        for encoding in encodings:
            try:
                # Test read with first few rows
                pd.read_csv(self.csv_path, encoding=encoding, nrows=5, on_bad_lines='skip')
                encoding_used = encoding
                print(f"Using encoding: {encoding}")
                break
            except Exception:
                continue
        
        if not encoding_used:
            raise Exception("Could not find compatible encoding")
        
        self._movies = []
        processed_count = 0
        
        try:
            # Read CSV in chunks to prevent memory issues
            chunk_reader = pd.read_csv(
                self.csv_path,
                encoding=encoding_used,
                chunksize=self._load_chunk_size,
                on_bad_lines='skip',
                low_memory=False
            )
            
            for chunk_num, chunk_df in enumerate(chunk_reader, 1):
                print(f"Processing chunk {chunk_num} ({len(chunk_df)} rows)...")
                
                for idx, row in chunk_df.iterrows():
                    try:
                        movie_id = processed_count + (idx - chunk_df.index[0]) + 1
                        movie = Movie.from_csv_row(row.to_dict(), movie_id)
                        self._movies.append(movie)
                    except Exception as e:
                        # Silently skip problematic rows to prevent console spam
                        continue
                
                processed_count = len(self._movies)
                
                # Progress update every 5 chunks
                if chunk_num % 5 == 0:
                    print(f"  Processed {processed_count} movies so far...")
            
            self._next_movie_id = len(self._movies) + 1
            print(f"✅ Successfully loaded {len(self._movies)} movies")
            
        except Exception as e:
            print(f"Error during chunked loading: {e}")
            # Continue with whatever movies were loaded
            self._next_movie_id = len(self._movies) + 1
    
    def _save_to_csv(self):
        """Save current movies back to CSV file"""
        try:
            with self._lock:
                # Convert movies to DataFrame format
                data = []
                for movie in self._movies:
                    row = {
                        "title_y": movie.title,
                        "overview": movie.overview,
                        "genres": json.dumps(movie.genres) if movie.genres else "",
                        "keywords": json.dumps(movie.keywords) if movie.keywords else "",
                        "tagline": movie.tagline,
                        "cast": json.dumps(movie.cast) if movie.cast else "",
                        "crew": json.dumps(movie.crew) if movie.crew else "",
                        "production_companies": json.dumps(movie.production_companies) if movie.production_companies else "",
                        "production_countries": json.dumps(movie.production_countries) if movie.production_countries else "",
                        "spoken_languages": json.dumps(movie.spoken_languages) if movie.spoken_languages else "",
                        "original_language": movie.original_language,
                        "original_title": movie.original_title,
                        "release_date": movie.release_date,
                        "runtime": movie.runtime,
                        "vote_average": movie.vote_average,
                        "vote_count": movie.vote_count,
                        "popularity": movie.popularity
                    }
                    data.append(row)
                
                df = pd.DataFrame(data)
                df.to_csv(self.csv_path, index=False)
                print(f"Saved {len(self._movies)} movies to CSV")
        
        except Exception as e:
            print(f"Error saving to CSV: {e}")
    
    def get_movies_paginated(self, page: int = 1, size: int = 20, filters: Optional[MovieFilters] = None) -> tuple[List[Movie], int]:
        """Get paginated movies with optional filtering"""
        self._ensure_loaded()  # Lazy load
        
        with self._lock:
            filtered_movies = self._apply_filters(self._movies.copy(), filters)
            total = len(filtered_movies)
            
            # Calculate pagination
            start_idx = (page - 1) * size
            end_idx = start_idx + size
            
            return filtered_movies[start_idx:end_idx], total
    
    def _apply_filters(self, movies: List[Movie], filters: Optional[MovieFilters]) -> List[Movie]:
        """Apply filters to movie list"""
        if not filters:
            return movies
        
        filtered = movies
        
        # Search filter
        if filters.search:
            search_term = filters.search.lower()
            filtered = [
                movie for movie in filtered
                if (movie.title and search_term in movie.title.lower()) or
                   (movie.overview and search_term in movie.overview.lower()) or
                   any(cast_member.get("name", "").lower().find(search_term) >= 0 for cast_member in movie.cast) or
                   any(crew_member.get("name", "").lower().find(search_term) >= 0 for crew_member in movie.crew)
            ]
        
        # Genre filter
        if filters.genres:
            filtered = [
                movie for movie in filtered
                if any(genre.get("name", "").lower() in [g.lower() for g in filters.genres] for genre in movie.genres)
            ]
        
        # Year filters
        if filters.year_from or filters.year_to:
            filtered = [
                movie for movie in filtered
                if self._check_year_filter(movie.release_date, filters.year_from, filters.year_to)
            ]
        
        # Rating filters
        if filters.rating_from is not None:
            filtered = [movie for movie in filtered if movie.vote_average and movie.vote_average >= filters.rating_from]
        
        if filters.rating_to is not None:
            filtered = [movie for movie in filtered if movie.vote_average and movie.vote_average <= filters.rating_to]
        
        # Runtime filters
        if filters.runtime_from is not None:
            filtered = [movie for movie in filtered if movie.runtime and movie.runtime >= filters.runtime_from]
        
        if filters.runtime_to is not None:
            filtered = [movie for movie in filtered if movie.runtime and movie.runtime <= filters.runtime_to]
        
        # Language filter
        if filters.language:
            filtered = [movie for movie in filtered if movie.original_language == filters.language]
        
        # Favorite filter
        if filters.is_favorite is not None:
            filtered = [movie for movie in filtered if movie.is_favorite == filters.is_favorite]
        
        # Personal rating filters
        if filters.personal_rating_from is not None:
            filtered = [movie for movie in filtered if movie.personal_rating and movie.personal_rating >= filters.personal_rating_from]
        
        if filters.personal_rating_to is not None:
            filtered = [movie for movie in filtered if movie.personal_rating and movie.personal_rating <= filters.personal_rating_to]
        
        return filtered
    
    def _check_year_filter(self, release_date: Optional[str], year_from: Optional[int], year_to: Optional[int]) -> bool:
        """Check if movie release date falls within year range"""
        if not release_date:
            return False
        
        try:
            year = int(release_date.split("-")[0])
            if year_from and year < year_from:
                return False
            if year_to and year > year_to:
                return False
            return True
        except (ValueError, IndexError):
            return False
    
    def create_movie(self, command: CreateMovieCommand) -> int:
        """Create a new movie"""
        self._ensure_loaded()  # Lazy load
        
        with self._lock:
            movie = Movie(
                id=self._next_movie_id,
                title=command.title,
                overview=command.overview,
                genres=command.genres,
                keywords=command.keywords,
                tagline=command.tagline,
                cast=command.cast,
                crew=command.crew,
                production_companies=command.production_companies,
                production_countries=command.production_countries,
                spoken_languages=command.spoken_languages,
                original_language=command.original_language,
                original_title=command.original_title,
                release_date=command.release_date,
                runtime=command.runtime,
                vote_average=command.vote_average,
                vote_count=command.vote_count,
                popularity=command.popularity,
                is_favorite=False,
                personal_rating=None,
                personal_notes=None
            )
            self._movies.append(movie)
            self._next_movie_id += 1
            
            # Skip CSV saving for new movies to improve performance
            # TODO: Implement proper persistence if needed
            
            return movie.id
    
    def update_movie(self, id: int, command: UpdateMovieCommand) -> bool:
        """Update an existing movie"""
        self._ensure_loaded()  # Lazy load
        
        with self._lock:
            for movie in self._movies:
                if movie.id == id:
                    if command.title is not None:
                        movie.title = command.title
                    if command.overview is not None:
                        movie.overview = command.overview
                    if command.is_favorite is not None:
                        movie.is_favorite = command.is_favorite
                    if command.personal_rating is not None:
                        movie.personal_rating = command.personal_rating
                    if command.personal_notes is not None:
                        movie.personal_notes = command.personal_notes
                    
                    # Skip CSV saving for updates to improve performance
                    # Changes are kept in memory only
                    
                    return True
            return False
    
    def delete_movie(self, id: int) -> bool:
        """Delete a movie"""
        self._ensure_loaded()  # Lazy load
        
        with self._lock:
            for i, movie in enumerate(self._movies):
                if movie.id == id:
                    del self._movies[i]
                    
                    # Skip CSV saving for deletions to improve performance
                    # Changes are kept in memory only
                    
                    return True
            return False
    
    def get_movie_by_id(self, id: int) -> Optional[Movie]:
        """Get a movie by ID"""
        self._ensure_loaded()  # Lazy load
        
        with self._lock:
            for movie in self._movies:
                if movie.id == id:
                    return movie
            return None

    def create_user(self, parsed_info: ParsedUserInfo) -> int:
        """Create a new user profile from parsed information"""
        with self._lock:
            user = UserProfile(
                id=self._next_user_id,
                first_name=parsed_info.first_name,
                last_name=parsed_info.last_name,
                phone_number=parsed_info.phone_number,
                street_address=parsed_info.street_address,
                apartment_number=parsed_info.apartment_number,
                city=parsed_info.city,
                state=parsed_info.state,
                country=parsed_info.country,
                zip_code=parsed_info.zip_code,
                created_at=datetime.now().isoformat()
            )
            self._users.append(user)
            self._next_user_id += 1
            return user.id

    def get_user_by_id(self, id: int) -> Optional[UserProfile]:
        """Get a user by ID"""
        with self._lock:
            for user in self._users:
                if user.id == id:
                    return user
            return None

    def get_all_users(self) -> List[UserProfile]:
        """Get all users"""
        with self._lock:
            return self._users.copy()

    def delete_user(self, id: int) -> bool:
        """Delete a user by ID"""
        with self._lock:
            for i, user in enumerate(self._users):
                if user.id == id:
                    del self._users[i]
                    return True
            return False


# Initialize database instance
db = MovieDatabase()