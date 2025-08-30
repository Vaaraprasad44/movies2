# Problems & Challenges Faced During Development

This document catalogues all the problems, bugs, and challenges encountered during the development of the Movie Collection App, along with their solutions.

---

## 🐛 Backend Issues

### 1. CSV Loading Performance & Timeouts

**Problem**: The 49MB `Semantic_Recent.csv` file (4,808 movies) was causing server timeouts during startup.

**Symptoms**:
- Server would hang on startup when trying to load the entire CSV
- Initial API calls would timeout waiting for data to load
- Memory exhaustion with large datasets

**Solution**:
- Implemented **chunked loading** (200 rows per chunk)
- Added **lazy initialization** - CSV loads only on first API request
- Used **encoding detection** (latin-1) to handle special characters
- Added progress logging every 5 chunks

**Code Changes**:
```python
# database.py
chunk_reader = pd.read_csv(
    self.csv_path,
    encoding=encoding_used,
    chunksize=self._load_chunk_size,  # 200 rows
    on_bad_lines='skip',
    low_memory=False
)
```

### 2. API Branding Issues

**Problem**: Swagger UI still showed "Product Inventory API" instead of "Movies API" after code changes.

**Symptoms**:
- Swagger title showed outdated "Product Inventory API" 
- OpenAPI spec contained old Todo/Product references
- API documentation was misleading

**Solution**:
- Regenerated OpenAPI specification using `generate_api_specification.py`
- Updated FastAPI app title and description in `main.py`
- Formatted the JSON spec for better readability

**Code Changes**:
```python
# main.py
app = FastAPI(title="Movies API", version="v1", docs_url="/swagger", redoc_url="/redoc")
app.description = "Favorite Movies Search & CRUD API"
```

### 3. Data Type Handling

**Problem**: CSV parsing was failing on certain rows with malformed data.

**Solution**:
- Added `on_bad_lines='skip'` parameter
- Implemented try-catch blocks around individual row parsing
- Silent error handling to prevent console spam

---

## 🔄 Frontend Issues

### 4. React Infinite Loop (Maximum Update Depth Exceeded)

**Problem**: "Maximum update depth exceeded" error causing the React app to crash.

**Symptoms**:
- React would throw infinite loop errors
- Page would become unresponsive
- Console filled with setState warnings

**Root Cause Analysis**:
1. **MovieFilters component**: `useCallback` dependency array included `filters` object
2. **URL synchronization**: `getFiltersFromUrl()` was called in useState initializer
3. **Circular dependencies**: Filter changes → URL updates → Re-renders → Filter changes

**Solution Steps**:
1. **Fixed MovieFilters component**:
   ```typescript
   // Before (problematic)
   useCallback((search: string) => {
     onFiltersChange({ ...filters, search: search || undefined, page: 1 });
   }, [filters, onFiltersChange])  // filters dependency caused infinite loop

   // After (fixed)
   const filtersRef = useRef(filters);
   useCallback((search: string) => {
     onFiltersChange({ ...filtersRef.current, search: search || undefined, page: 1 });
   }, [onFiltersChange])  // stable dependency
   ```

2. **Fixed URL synchronization**:
   ```typescript
   // Before (problematic)
   const [filters, setFilters] = useState(() => ({
     page: 1, size: 20, ...getFiltersFromUrl()  // Called on every render
   }));

   // After (fixed)
   const [filters, setFilters] = useState({ page: 1, size: 20 });
   useEffect(() => {
     const urlFilters = getFiltersFromUrl();
     if (Object.keys(urlFilters).length > 0) {
       setFilters(prev => ({ ...prev, ...urlFilters }));
     }
   }, []); // Only on mount
   ```

3. **Stabilized event handlers** with `useCallback` and proper dependencies

### 5. API Integration Issues

**Problem**: Frontend was using mock data instead of connecting to the actual API.

**Symptoms**:
- Only 2 sample movies showing instead of 4,808 real movies
- CRUD operations not persisting
- Search and filtering not working with real data

**Solution**:
- Restored `useGetMoviesQuery` API hook
- Removed mock data implementation
- Re-enabled URL synchronization after fixing infinite loop
- Updated environment variables for API connection

---

## 🔧 Integration Issues

### 6. Environment Configuration

**Problem**: Frontend couldn't connect to the Python API due to environment variable issues.

**Solution**:
- Configured `.env.development` with correct API URL
- Used Aspire service placeholders for orchestration
- Set up proper CORS in FastAPI backend

### 7. File Path Resolution

**Problem**: PythonApi couldn't find the CSV database file.

**Issue**: Path resolution from `PythonApi/` directory to `../Semantic_Recent.csv`

**Verification**:
```bash
# From PythonApi directory
ls -la ../Semantic_Recent.csv  # Confirmed file exists
```

**Solution**: Relative path `../Semantic_Recent.csv` was correct, issue was with lazy loading implementation.

---

## 📚 Documentation Issues

### 8. Outdated Documentation

**Problem**: Multiple README files with conflicting or outdated information.

**Issues**:
- `PythonApi/README.md` referenced "Todo API" instead of Movies API
- Root `README.md` was too comprehensive for end users
- Missing clear setup instructions

**Solution**:
- Moved comprehensive README to `PRD.md` (Product Requirements Document)
- Created new concise `README.md` focused on actual implementation
- Removed outdated `PythonApi/README.md`
- Updated `SESSION_PROMPTS.md` with complete development history

---

## 🚀 Performance Issues

### 9. Large Dataset Handling

**Problem**: 4,808 movies with 1,275+ columns causing performance issues.

**Optimizations**:
- **Chunked CSV processing** to prevent memory exhaustion
- **Lazy loading** to reduce startup time
- **Client-side pagination** to limit DOM rendering
- **Debounced search** to reduce API calls
- **Efficient re-renders** using React optimizations

---

## 🔍 Type Safety Issues

### 10. API Type Generation

**Problem**: Generic `object[]` types from OpenAPI generation causing type safety issues.

**Solution**:
- Proper type guards and conditional checking
- Runtime field validation in components
- Flexible API type handling for production readiness

---

## 📊 Testing & Validation Issues

### 11. End-to-End Testing

**Problem**: No comprehensive testing of complete application flow.

**Solution**:
- Manual verification of CSV database connection (4,808 movies loaded)
- API endpoint testing via Swagger UI
- Frontend integration testing with real data
- CRUD operations validation

---

## 🎯 Key Lessons Learned

### 1. **React State Management**
- Be careful with useCallback dependencies
- Use refs for stable references in callbacks
- Avoid calling functions in useState initializers

### 2. **Large Dataset Handling**
- Always implement chunked loading for large files
- Use lazy initialization to improve startup performance
- Consider pagination and virtualization for UI

### 3. **API Integration**
- Verify environment variables and CORS configuration
- Test API endpoints independently before frontend integration
- Use proper error handling and fallbacks

### 4. **Documentation Management**
- Keep documentation focused and up-to-date
- Separate technical specs from user guides
- Maintain development history for debugging

### 5. **Type Safety**
- Invest in proper TypeScript configuration early
- Use runtime validation alongside compile-time checks
- Generate types from API schemas when possible

---

## 🔧 Tools & Techniques Used for Debugging

1. **React Developer Tools** - Component state inspection
2. **Browser Console** - Error stack traces and logging
3. **Python logging** - CSV loading progress and error tracking
4. **Swagger UI** - API endpoint testing
5. **Network tab** - API request/response inspection
6. **ESLint warnings** - Catching dependency array issues
7. **Manual testing** - End-to-end workflow validation

---

**Total Issues Resolved**: 11 major problems across backend, frontend, integration, and documentation
**Development Time**: Iterative problem-solving across multiple sessions
**Final Result**: Fully functional movie collection application with 4,808 movies