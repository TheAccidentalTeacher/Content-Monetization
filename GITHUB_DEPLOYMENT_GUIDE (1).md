# GitHub Deployment Guide

This guide explains how to deploy the Christian Content & Book Research Platform to GitHub and make it accessible via GitHub Pages.

## Prerequisites

- GitHub account
- Git installed on your computer (optional, as you can also use GitHub's web interface)

## Deployment Steps

### Option 1: Using GitHub Web Interface

1. **Create a New Repository**
   - Go to [GitHub](https://github.com) and sign in
   - Click the "+" icon in the top right corner and select "New repository"
   - Name your repository (e.g., "christian-content-platform")
   - Add a description (optional)
   - Choose "Public" visibility
   - Check "Add a README file"
   - Click "Create repository"

2. **Upload Files**
   - In your new repository, click "Add file" > "Upload files"
   - Drag and drop all the files from this project or select them from your computer
   - Add a commit message (e.g., "Initial upload")
   - Click "Commit changes"

3. **Enable GitHub Pages**
   - Go to your repository's "Settings" tab
   - Scroll down to the "GitHub Pages" section
   - Under "Source", select "main" branch
   - Click "Save"
   - Wait a few minutes for your site to be published
   - GitHub will provide a URL where your site is published (e.g., https://yourusername.github.io/christian-content-platform/)

### Option 2: Using Git Command Line

1. **Create a New Repository on GitHub**
   - Go to [GitHub](https://github.com) and sign in
   - Click the "+" icon in the top right corner and select "New repository"
   - Name your repository (e.g., "christian-content-platform")
   - Do NOT initialize with README, .gitignore, or license
   - Click "Create repository"

2. **Initialize Local Repository and Push to GitHub**
   ```bash
   # Initialize Git repository
   git init

   # Add all files
   git add .

   # Commit files
   git commit -m "Initial commit"

   # Add remote repository
   git remote add origin https://github.com/yourusername/christian-content-platform.git

   # Push to GitHub
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repository's "Settings" tab
   - Scroll down to the "GitHub Pages" section
   - Under "Source", select "main" branch
   - Click "Save"
   - Wait a few minutes for your site to be published
   - GitHub will provide a URL where your site is published

## Accessing Your Platform

Once deployed, your platform will be available at:
```
https://yourusername.github.io/christian-content-platform/
```

The platform will automatically redirect to the main application file.

## Testing Your Deployment

1. Visit your GitHub Pages URL
2. You should be redirected to the platform interface
3. Click "Skip to Testing Mode" to verify functionality without API keys
4. Test various features using the Testing tab

## Updating Your Platform

### Using GitHub Web Interface
1. Navigate to the file you want to update
2. Click the pencil icon to edit
3. Make your changes
4. Add a commit message
5. Click "Commit changes"

### Using Git Command Line
```bash
# Pull latest changes
git pull origin main

# Make your changes

# Add changes
git add .

# Commit changes
git commit -m "Update description"

# Push changes
git push origin main
```

## Troubleshooting

### Site Not Publishing
- Ensure GitHub Pages is enabled in repository settings
- Check that your repository is public
- Verify that the main HTML file is in the correct location
- Wait a few minutes as GitHub Pages deployment can take time

### Redirect Not Working
- Check that the meta refresh tag is present in index.html
- Verify the path to src/index.html is correct

### Testing Mode Issues
- Open browser developer tools (F12) to check for errors
- Verify that all JavaScript files are loading correctly

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Git Documentation](https://git-scm.com/doc)