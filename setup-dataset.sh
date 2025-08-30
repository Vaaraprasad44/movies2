#!/bin/bash

# Setup script for Movie Collection App dataset
# Downloads the Semantic_Recent.csv movie dataset

echo "🎬 Movie Collection App - Dataset Setup"
echo "======================================"

# Configuration
DATASET_URL=""
DATASET_FILE="Semantic_Recent.csv"
SAMPLE_DATASET_FILE="sample_movies.csv"
TEMP_FILE="/tmp/Semantic_Recent.csv"
FULL_DATASET_BACKUP="Semantic_Recent_FULL.csv"  # Backup location for full dataset

# Check if dataset already exists
if [ -f "$DATASET_FILE" ]; then
    MOVIE_COUNT=$(tail -n +2 "$DATASET_FILE" | wc -l)
    FILE_SIZE=$(ls -lh "$DATASET_FILE" | awk '{print $5}')
    
    echo "✅ Dataset found: $DATASET_FILE"
    echo "📊 File size: $FILE_SIZE"
    echo "📈 Current movie count: $MOVIE_COUNT movies"
    
    # Check if this is the sample dataset (10-20 movies) or full dataset (1000+ movies)
    if [ "$MOVIE_COUNT" -ge 1000 ]; then
        echo "🎉 Full dataset already installed with $MOVIE_COUNT movies!"
        echo "🌟 You have access to the complete movie collection!"
        echo ""
        echo "🚀 Application is ready to run:"
        echo ""
        echo "Backend (Terminal 1):"
        echo "  cd PythonApi"
        echo "  python run_app.py"
        echo ""
        echo "Frontend (Terminal 2):"
        echo "  cd web"
        echo "  pnpm dev"
        echo ""
        exit 0
    else
        echo "📝 Currently using sample dataset ($MOVIE_COUNT movies)"
        echo "🔄 This script will upgrade you to the full dataset with 4800+ movies!"
        echo ""
        echo "Would you like to upgrade to the full dataset? [Y/n]"
        read -r response
        if [[ "$response" =~ ^[Nn]$ ]]; then
            echo "📋 Keeping sample dataset. You can run this script again to upgrade."
            exit 0
        fi
        echo "🚀 Proceeding with full dataset installation..."
    fi
else
    echo "📂 No dataset found."
fi

echo "📥 Installing full movie dataset..."

# Method 1: Download from URL (if available)
if [ ! -z "$DATASET_URL" ]; then
    echo "🌐 Downloading dataset from: $DATASET_URL"
    
    # Check if curl or wget is available
    if command -v curl >/dev/null 2>&1; then
        curl -L "$DATASET_URL" -o "$TEMP_FILE"
    elif command -v wget >/dev/null 2>&1; then
        wget "$DATASET_URL" -O "$TEMP_FILE"
    else
        echo "❌ Error: Neither curl nor wget found. Please install one of them."
        exit 1
    fi
    
    # Verify download
    if [ -f "$TEMP_FILE" ]; then
        mv "$TEMP_FILE" "$DATASET_FILE"
        echo "✅ Dataset downloaded successfully!"
    else
        echo "❌ Error: Failed to download dataset"
        exit 1
    fi
else
    # Method 2: Create full dataset from backup or user-provided content
    echo "🔍 Looking for full dataset content..."
    
    # Check if backup exists
    if [ -f "$FULL_DATASET_BACKUP" ]; then
        echo "📂 Found full dataset backup: $FULL_DATASET_BACKUP"
        cp "$FULL_DATASET_BACKUP" "$DATASET_FILE"
        echo "✅ Full dataset restored from backup!"
    else
        echo "📝 Full dataset setup instructions:"
        echo ""
        echo "To install the full movie dataset (4800+ movies):"
        echo "1. Obtain a comprehensive movie dataset in CSV format"
        echo "2. Save it as '$DATASET_FILE' in this directory"
        echo "3. Run this script again"
        echo ""
        echo "🔍 The CSV should have this format:"
        echo "   title_y,overview,genres,keywords,tagline,cast,crew,..."
        echo ""
        echo "📋 Recommended sources:"
        echo "   - Kaggle Movie datasets (TMDB 5000, MovieLens, etc.)"
        echo "   - The Movie Database (TMDB) exports"
        echo "   - MovieLens datasets"
        echo ""
        echo "⚠️  For now, the application will use the sample dataset."
        echo "    Make sure sample_movies.csv exists for basic functionality."
        exit 1
    fi
fi

# Verify the dataset format
echo "🔍 Verifying dataset format..."

if [ ! -f "$DATASET_FILE" ]; then
    echo "❌ Error: Dataset file not found"
    exit 1
fi

# Check file size
FILE_SIZE=$(ls -lh "$DATASET_FILE" | awk '{print $5}')
echo "📊 Dataset size: $FILE_SIZE"

# Count movies (excluding header)
MOVIE_COUNT=$(tail -n +2 "$DATASET_FILE" | wc -l)
echo "📈 Movies in dataset: $MOVIE_COUNT"

# Verify CSV header
HEADER=$(head -n 1 "$DATASET_FILE")
if [[ "$HEADER" == *"title_y"* ]] && [[ "$HEADER" == *"overview"* ]] && [[ "$HEADER" == *"genres"* ]]; then
    echo "✅ Dataset format verified!"
    echo ""
    
    # Give appropriate success message based on dataset size
    if [ "$MOVIE_COUNT" -ge 1000 ]; then
        echo "🎉 Full dataset setup complete with $MOVIE_COUNT movies!"
        echo "🌟 You now have access to a comprehensive movie collection!"
    else
        echo "✅ Sample dataset setup complete with $MOVIE_COUNT movies"
        echo "📝 Note: This is a limited dataset for testing purposes"
        echo "   For the full experience, replace with a dataset containing 4000+ movies"
    fi
    
    echo ""
    echo "🚀 You can now start the application:"
    echo ""
    echo "Backend (Terminal 1):"
    echo "  cd PythonApi"
    echo "  python run_app.py"
    echo ""
    echo "Frontend (Terminal 2):"
    echo "  cd web"
    echo "  pnpm dev"
    echo ""
    echo "📱 The application will be available at:"
    echo "  Frontend: http://localhost:3000"
    echo "  API Docs: http://localhost:8000/swagger"
    echo ""
else
    echo "❌ Warning: Dataset format may not be compatible"
    echo "Expected columns: title_y, overview, genres, keywords, etc."
    echo "Found header: $HEADER"
fi