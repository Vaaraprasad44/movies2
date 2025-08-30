import pytest
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from main import app
from database import db


@pytest.fixture(autouse=True)
def reset_database():
    """Reset the database before each test"""
    db._movies.clear()
    db._next_id = 1
    yield
    db._movies.clear()
    db._next_id = 1


class TestMovieAPI:
    """Integration tests for the Movie API endpoints"""
    
    def setup_method(self):
        """Create a test client for each test"""
        self.client = TestClient(app)
    
    def test_get_empty_movies(self):
        """Test getting movies when database is empty"""
        response = self.client.get("/api/Movies")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["size"] == 20
    
    def test_create_movie(self):
        """Test creating a new movie"""
        movie_data = {
            "title": "Test Movie",
            "overview": "A test movie for testing purposes",
            "release_date": "2023-01-01",
            "vote_average": 8.5,
            "runtime": 120
        }
        
        response = self.client.post("/api/Movies", json=movie_data)
        assert response.status_code == 200
        movie_id = response.json()
        assert movie_id == 1
        
        # Verify it was created
        response = self.client.get("/api/Movies")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        movie = data["items"][0]
        assert movie["id"] == 1
        assert movie["title"] == "Test Movie"
        assert movie["overview"] == "A test movie for testing purposes"
        assert movie["is_favorite"] == False
    
    def test_get_movie_by_id(self):
        """Test getting a specific movie by ID"""
        # Create a movie first
        movie_data = {"title": "Test Movie", "overview": "Test overview"}
        create_response = self.client.post("/api/Movies", json=movie_data)
        movie_id = create_response.json()
        
        # Get the movie by ID
        response = self.client.get(f"/api/Movies/{movie_id}")
        assert response.status_code == 200
        movie = response.json()
        assert movie["id"] == movie_id
        assert movie["title"] == "Test Movie"
    
    def test_get_nonexistent_movie(self):
        """Test getting a movie that doesn't exist"""
        response = self.client.get("/api/Movies/999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Movie not found"
    
    def test_update_movie(self):
        """Test updating an existing movie"""
        # Create a movie
        movie_data = {"title": "Original Title"}
        create_response = self.client.post("/api/Movies", json=movie_data)
        movie_id = create_response.json()
        
        # Update it
        update_data = {
            "title": "Updated Title",
            "is_favorite": True,
            "personal_rating": 9.0,
            "personal_notes": "Great movie!"
        }
        
        update_response = self.client.put(f"/api/Movies/{movie_id}", json=update_data)
        assert update_response.status_code == 200
        
        # Verify the update
        response = self.client.get(f"/api/Movies/{movie_id}")
        movie = response.json()
        assert movie["title"] == "Updated Title"
        assert movie["is_favorite"] == True
        assert movie["personal_rating"] == 9.0
        assert movie["personal_notes"] == "Great movie!"
    
    def test_update_nonexistent_movie(self):
        """Test updating a movie that doesn't exist"""
        response = self.client.put(
            "/api/Movies/999",
            json={"title": "Updated", "is_favorite": True}
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Movie not found"
    
    def test_delete_movie(self):
        """Test deleting an existing movie"""
        # Create two movies
        movie1 = self.client.post("/api/Movies", json={"title": "Movie 1"})
        id1 = movie1.json()
        movie2 = self.client.post("/api/Movies", json={"title": "Movie 2"})
        id2 = movie2.json()
        
        # Delete the first one
        delete_response = self.client.delete(f"/api/Movies/{id1}")
        assert delete_response.status_code == 200
        
        # Verify only second remains
        response = self.client.get("/api/Movies")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["id"] == id2
        assert data["items"][0]["title"] == "Movie 2"
    
    def test_delete_nonexistent_movie(self):
        """Test deleting a movie that doesn't exist"""
        response = self.client.delete("/api/Movies/999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Movie not found"
    
    def test_toggle_favorite(self):
        """Test toggling favorite status of a movie"""
        # Create a movie
        movie_data = {"title": "Test Movie"}
        create_response = self.client.post("/api/Movies", json=movie_data)
        movie_id = create_response.json()
        
        # Toggle favorite (should become True)
        response = self.client.post(f"/api/Movies/{movie_id}/favorite")
        assert response.status_code == 200
        assert response.json()["is_favorite"] == True
        
        # Toggle again (should become False)
        response = self.client.post(f"/api/Movies/{movie_id}/favorite")
        assert response.status_code == 200
        assert response.json()["is_favorite"] == False
    
    def test_get_favorite_movies(self):
        """Test getting only favorite movies"""
        # Create movies with different favorite status
        movie1 = self.client.post("/api/Movies", json={"title": "Movie 1"})
        id1 = movie1.json()
        movie2 = self.client.post("/api/Movies", json={"title": "Movie 2"})
        id2 = movie2.json()
        movie3 = self.client.post("/api/Movies", json={"title": "Movie 3"})
        id3 = movie3.json()
        
        # Mark movies 1 and 3 as favorites
        self.client.post(f"/api/Movies/{id1}/favorite")
        self.client.post(f"/api/Movies/{id3}/favorite")
        
        # Get favorites
        response = self.client.get("/api/Movies/favorites")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        favorite_ids = [movie["id"] for movie in data["items"]]
        assert id1 in favorite_ids
        assert id3 in favorite_ids
        assert id2 not in favorite_ids
    
    def test_search_movies(self):
        """Test searching movies by title and overview"""
        # Create test movies
        movies = [
            {"title": "Avatar", "overview": "A movie about blue aliens"},
            {"title": "Titanic", "overview": "A ship sinks in the ocean"},
            {"title": "The Matrix", "overview": "Reality is not what it seems"}
        ]
        
        for movie in movies:
            self.client.post("/api/Movies", json=movie)
        
        # Search by title
        response = self.client.get("/api/Movies/search?q=Avatar")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Avatar"
        
        # Search by overview
        response = self.client.get("/api/Movies/search?q=ship")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Titanic"
        
        # Search with no results
        response = self.client.get("/api/Movies/search?q=nonexistent")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
    
    def test_pagination(self):
        """Test pagination functionality"""
        # Create 25 movies
        for i in range(25):
            self.client.post("/api/Movies", json={"title": f"Movie {i+1}"})
        
        # Get first page (default size 20)
        response = self.client.get("/api/Movies")
        data = response.json()
        assert data["total"] == 25
        assert data["page"] == 1
        assert data["size"] == 20
        assert data["pages"] == 2
        assert len(data["items"]) == 20
        
        # Get second page
        response = self.client.get("/api/Movies?page=2")
        data = response.json()
        assert data["total"] == 25
        assert data["page"] == 2
        assert data["size"] == 20
        assert data["pages"] == 2
        assert len(data["items"]) == 5
        
        # Test custom page size
        response = self.client.get("/api/Movies?page=1&size=10")
        data = response.json()
        assert data["size"] == 10
        assert len(data["items"]) == 10
    
    def test_filters(self):
        """Test various filtering options"""
        # Create movies with different attributes
        movies = [
            {
                "title": "Action Movie 1",
                "overview": "Explosions and car chases",
                "release_date": "2020-01-01",
                "vote_average": 7.5,
                "runtime": 120,
                "original_language": "en",
                "genres": [{"id": 28, "name": "Action"}]
            },
            {
                "title": "Drama Movie 1",
                "overview": "Deep emotional story",
                "release_date": "2019-01-01",
                "vote_average": 8.5,
                "runtime": 150,
                "original_language": "fr",
                "genres": [{"id": 18, "name": "Drama"}]
            }
        ]
        
        for movie in movies:
            self.client.post("/api/Movies", json=movie)
        
        # Test year filter
        response = self.client.get("/api/Movies?year_from=2020")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Action Movie 1"
        
        # Test rating filter
        response = self.client.get("/api/Movies?rating_from=8.0")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Drama Movie 1"
        
        # Test language filter
        response = self.client.get("/api/Movies?language=fr")
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["title"] == "Drama Movie 1"
    
    def test_get_stats(self):
        """Test getting database statistics"""
        # Create some test movies
        movies = [
            {
                "title": "Action Movie",
                "genres": [{"id": 28, "name": "Action"}],
                "release_date": "2020-01-01"
            },
            {
                "title": "Drama Movie", 
                "genres": [{"id": 18, "name": "Drama"}],
                "release_date": "2019-01-01"
            }
        ]
        
        for movie in movies:
            create_response = self.client.post("/api/Movies", json=movie)
            movie_id = create_response.json()
            
        # Mark one as favorite
        self.client.post(f"/api/Movies/1/favorite")
        
        # Add personal rating to one
        self.client.put("/api/Movies/2", json={"personal_rating": 9.0})
        
        # Get stats
        response = self.client.get("/api/stats")
        assert response.status_code == 200
        stats = response.json()
        
        assert stats["total_movies"] == 2
        assert stats["favorites_count"] == 1
        assert stats["rated_count"] == 1
        assert len(stats["top_genres"]) >= 2
        assert any(genre[0] == "Action" for genre in stats["top_genres"])
        assert any(genre[0] == "Drama" for genre in stats["top_genres"])
    
    def test_cors_headers(self):
        """Test that CORS headers are properly set"""
        response = self.client.get(
            "/api/Movies",
            headers={"Origin": "http://localhost:3000"}
        )
        assert response.status_code == 200
        assert "access-control-allow-origin" in response.headers
        assert response.headers["access-control-allow-origin"] == "*"
    
    def test_empty_title_handling(self):
        """Test creating a movie with empty title"""
        response = self.client.post("/api/Movies", json={"title": ""})
        assert response.status_code == 200
        
        # Verify it was created with empty title
        movies = self.client.get("/api/Movies").json()
        assert movies["total"] == 1
        assert movies["items"][0]["title"] == ""