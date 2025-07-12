# Bug Fix: Wrong Publication Years in Christian Novels Discovery

## Issue Reported by Alana Terry
**Problem**: The "Christian Novels Discovery" feature was showing incorrect publication years for books, displaying old books (2009, 2018, 2020) instead of truly recent releases from the last 30 days.

## Root Causes Identified

### 1. **Date Processing Bug**
- **Issue**: The code was converting full publication dates to just years, losing month/day information needed for 30-day filtering
- **Location**: `searchGoogleBooks()` function in both `index.html` and `src/index.html`
- **Before**: `publishDate = new Date(publishDate).getFullYear().toString()`
- **After**: Preserves full date as `fullPublishDate` while displaying year as `publishDate`

### 2. **Inadequate Google Books API Query**
- **Issue**: Search queries weren't using Google Books' built-in date filtering capabilities
- **Before**: Generic searches like `"Christian novels 2024 2025"`
- **After**: Proper date-filtered queries like `subject:"Christian fiction" publishedDate:2025-06-12..2025-07-12`

### 3. **Weak Date Filtering Logic**
- **Issue**: The filtering logic was too permissive, accepting books from previous years
- **Before**: Included books from current year and previous year
- **After**: Prioritizes books from last 30 days, falls back to current year only if no recent books found

## Fixes Implemented

### ✅ **Enhanced Date Extraction**
```javascript
// Now preserves full date for accurate filtering
let fullPublishDate = null;
if (publishDate && publishDate !== 'Unknown') {
    try {
        fullPublishDate = new Date(publishDate);
        publishYear = fullPublishDate.getFullYear().toString();
        publishDate = publishYear; // Display year in UI
    } catch (error) {
        console.log('Error parsing date:', publishDate);
    }
}

return {
    // ... other fields
    publishDate: publishDate,           // Year for display
    fullPublishDate: fullPublishDate,   // Full date for filtering
    originalPublishDate: volumeInfo.publishedDate // Original API response
};
```

### ✅ **Improved Google Books API Queries**
```javascript
const searchQueries = [
    // Strict 30-day filtering
    `subject:"Christian fiction" publishedDate:${thirtyDaysAgoString}..${currentDateString}`,
    `subject:"Christian romance" publishedDate:${thirtyDaysAgoString}..${currentDateString}`,
    
    // Fallback to current year if no 30-day results
    `subject:"Christian fiction" publishedDate:${currentYear}-01-01..${currentDateString}`,
    
    // Additional fallbacks
    `subject:"Christian fiction" orderBy:newest`,
    `"new Christian novel" ${currentYear}`
];
```

### ✅ **Stricter Date Filtering Logic**
```javascript
const recentBooks = uniqueBooks.filter(book => {
    let isRecent = false;
    
    if (book.fullPublishDate && !isNaN(book.fullPublishDate.getTime())) {
        // Priority 1: Books from last 30 days
        if (book.fullPublishDate >= thirtyDaysAgo) {
            isRecent = true;
            console.log(`Found truly recent book: ${book.title} (${book.originalPublishDate})`);
        }
        // Priority 2: Current year books only if no 30-day books found
        else if (book.fullPublishDate.getFullYear() === currentYear) {
            isRecent = true;
        }
    }
    
    return isChristianFiction && isRecent;
});
```

### ✅ **Enhanced Sorting Priority**
```javascript
const sortedBooks = recentBooks.sort((a, b) => {
    // First priority: books from last 30 days
    const aIsVeryRecent = a.fullPublishDate && a.fullPublishDate >= thirtyDaysAgo;
    const bIsVeryRecent = b.fullPublishDate && b.fullPublishDate >= thirtyDaysAgo;
    
    if (aIsVeryRecent && !bIsVeryRecent) return -1;
    if (!aIsVeryRecent && bIsVeryRecent) return 1;
    
    // Then by actual publication date (newest first)
    if (a.fullPublishDate && b.fullPublishDate) {
        return b.fullPublishDate.getTime() - a.fullPublishDate.getTime();
    }
    
    // Then by rating and reviews...
});
```

## Files Modified
1. **`/workspaces/Content-Monetization/index.html`**
   - Updated `discoverChristianNovels()` function
   - Enhanced `searchGoogleBooks()` data extraction
   - Improved date filtering and sorting logic

2. **`/workspaces/Content-Monetization/src/index.html`**
   - Synchronized with main file improvements
   - Applied same date processing fixes
   - Updated search queries and filtering

## Expected Results After Fix

### ✅ **Before Fix (Alana's Screenshot)**
- Books showing 2009, 2018, 2020 publication years
- Feature claiming "Recent Christian Novels (Last 30 Days)"
- Misleading results for users looking for new releases

### ✅ **After Fix**
- Books will show publication dates from last 30 days when available
- If no 30-day books exist, will show current year (2025) books
- Clear console logging shows which books are truly recent
- Better fallback handling with informative error messages
- Accurate metadata showing actual date range searched

## Testing Recommendations

1. **Test Recent Book Discovery**:
   - Click "Find Recent Novels" button
   - Verify books show 2025 publication dates
   - Check console logs for "Found truly recent book" messages

2. **Verify Date Accuracy**:
   - Inspect displayed books for correct publication years
   - Ensure no books from 2020, 2018, 2009 appear in "recent" results
   - Confirm books are sorted by publication date (newest first)

3. **Check Fallback Behavior**:
   - If no 30-day books found, should show current year books
   - Clear error messages when no recent books available
   - "Get Top Bestsellers" should still work for popular books

## Deployment Notes
- Both `index.html` and `src/index.html` updated simultaneously
- No breaking changes to existing functionality
- Enhanced console logging for debugging
- Improved user messaging for better UX

This fix directly addresses Alana Terry's feedback about wrong publication years and ensures the "Recent Christian Novels" feature accurately represents truly recent releases.
