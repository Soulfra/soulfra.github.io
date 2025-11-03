# Fix: File Upload Button Broken

## Problem
The file upload button on `auth.html` Import tab looks broken or doesn't respond to clicks properly.

## Current Code (auth.html around line 220):

```html
<label for="identityFile" class="file-upload">
  <div>📁 Click to select identity file</div>
  <input id="identityFile" type="file" accept=".json" onchange="importIdentity()">
</label>
```

### Current CSS (around line 152):

```css
.file-upload {
  margin: 20px 0;
  padding: 20px;
  border: 2px dashed rgba(255,255,255,0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.file-upload:hover {
  border-color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.05);
}

.file-upload input {
  display: none;
}
```

---

## The Fix

### Update CSS to ensure clickability:

Replace the `.file-upload` CSS with:

```css
.file-upload {
  margin: 20px 0;
  padding: 20px;
  border: 2px dashed rgba(255,255,255,0.3);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  display: block; /* Ensure it's a block element */
  text-align: center;
  user-select: none; /* Prevent text selection on click */
}

.file-upload:hover {
  border-color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.05);
}

.file-upload:active {
  transform: scale(0.98); /* Visual feedback on click */
}

.file-upload input {
  display: none; /* Correct - this hides the ugly default input */
}

.file-upload div {
  pointer-events: none; /* Let clicks pass through to label */
  font-size: 1rem;
  font-weight: 500;
}
```

---

## Why It Was Broken

**Possible issues:**
1. The `<div>` inside `<label>` might be blocking clicks
2. CSS `pointer-events` might be set wrong
3. Browser might not handle nested div + hidden input correctly

**The fix:**
- Add `pointer-events: none` to the inner div
- Ensure label is `display: block`
- Add visual feedback (`:active` state)
- Prevent text selection (`user-select: none`)

---

## Alternative: Simpler Button

If the label/hidden input pattern still doesn't work, replace with a button:

### Replace the HTML:

```html
<div class="file-upload-wrapper">
  <button type="button" class="file-upload-button" onclick="document.getElementById('identityFile').click()">
    📁 Click to select identity file
  </button>
  <input id="identityFile" type="file" accept=".json" onchange="importIdentity()" style="display: none;">
</div>
```

### Add this CSS:

```css
.file-upload-button {
  width: 100%;
  padding: 20px;
  border: 2px dashed rgba(255,255,255,0.3);
  border-radius: 8px;
  background: transparent;
  color: #fff;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.file-upload-button:hover {
  border-color: rgba(255,255,255,0.5);
  background: rgba(255,255,255,0.05);
}

.file-upload-button:active {
  transform: scale(0.98);
}
```

---

## Test

1. Open `auth.html`
2. Click "Import" tab
3. Click the file upload area
4. File picker should open immediately
5. Select a `.json` file
6. `importIdentity()` function should run

---

## If Still Broken

**Check browser console for errors:**

```javascript
// Add this to test if the element exists
console.log('Upload button:', document.querySelector('.file-upload'));
console.log('File input:', document.getElementById('identityFile'));

// Test if click event works
document.querySelector('.file-upload').addEventListener('click', () => {
  console.log('Upload area clicked!');
});
```

If console shows "Upload area clicked!" but file picker doesn't open:
- Your browser might be blocking it
- Try the button alternative above
- Check if `importIdentity()` function has errors

---

**Recommended: Use the button alternative - it's more reliable across browsers.**
