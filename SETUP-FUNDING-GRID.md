# 5-Minute Setup: Funding Grid

Get your Million Dollar Grid live and collecting investment applications in 5 minutes.

---

## What You're Building

A grid of 12 brands where investors click boxes to apply for funding. All submissions go to a Google Sheet (free CSV).

**Live at:** `funding-grid.html` (already created)

---

## Step 1: Create Google Form (2 minutes)

### 1. Go to Google Forms
- Visit: https://forms.google.com
- Click **+ Blank** to create new form

### 2. Add Form Fields

Create these questions (exactly as shown):

**Question 1:** Your Name
- Type: Short answer
- Required: Yes

**Question 2:** Email
- Type: Short answer
- Required: Yes

**Question 3:** Company/Organization
- Type: Short answer
- Required: No

**Question 4:** Investment Amount
- Type: Multiple choice
- Options:
  - $50K
  - $100K
  - $250K
  - $500K
  - $1M+
  - Other
- Required: No

**Question 5:** Message
- Type: Paragraph
- Required: No

**Question 6:** Brand
- Type: Short answer
- Required: Yes
- (This will be auto-filled from the grid)

**Question 7:** Timestamp
- Type: Short answer
- Required: Yes
- (This will be auto-filled)

### 3. Get Form Submission URL

- Click **Send** button (top right)
- Click **< >** (Link icon)
- Copy the URL (looks like: `https://docs.google.com/forms/d/e/FORM_ID/viewform`)
- Change `/viewform` to `/formResponse` at the end
- Save this URL for Step 3

---

## Step 2: Link Form to Google Sheet (1 minute)

### 1. In your Google Form:
- Click **Responses** tab
- Click green spreadsheet icon (Create Spreadsheet)
- Choose "Create a new spreadsheet"
- Click **Create**

### 2. You now have a Google Sheet!
- All form submissions will appear here automatically
- Columns: Timestamp, Name, Email, Company, Amount, Message, Brand, Timestamp

---

## Step 3: Connect Form to Funding Grid (2 minutes)

### 1. Get Form Field IDs

In your Google Form URL, look for the field IDs:
- Right-click on "Your Name" field → Inspect
- Find `entry.XXXXXXXX` in the HTML
- Write down the number for each field:

Example:
```
Name: entry.123456789
Email: entry.987654321
Company: entry.111222333
Amount: entry.444555666
Message: entry.777888999
Brand: entry.000111222
Timestamp: entry.333444555
```

### 2. Update funding-grid.html

Open `funding-grid.html` and find this section (around line 450):

```javascript
function submitApplication(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  // TODO: Replace with actual Google Form submission
```

Replace the TODO section with:

```javascript
// Submit to Google Form
const formUrl = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse';

const submitData = new URLSearchParams();
submitData.append('entry.123456789', formData.get('name'));
submitData.append('entry.987654321', formData.get('email'));
submitData.append('entry.111222333', formData.get('company'));
submitData.append('entry.444555666', formData.get('amount'));
submitData.append('entry.777888999', formData.get('message'));
submitData.append('entry.000111222', formData.get('brand'));
submitData.append('entry.333444555', formData.get('timestamp'));

fetch(formUrl, {
  method: 'POST',
  mode: 'no-cors',
  body: submitData
});
```

**Replace:**
- `YOUR_FORM_ID` with your actual form ID
- `entry.XXXXXXXX` with your actual field IDs

---

## Step 4: Deploy to GitHub Pages (Already Done!)

Your funding grid is already in the repo at:
```
projects/soulfra.github.io/funding-grid.html
```

If you have GitHub Pages enabled, it's live at:
```
https://soulfra.github.io/funding-grid.html
```

If not, enable GitHub Pages:
1. Go to repo Settings
2. Pages → Source → main branch
3. Save
4. Wait 1-2 minutes
5. Visit `https://YOUR_USERNAME.github.io/funding-grid.html`

---

## Step 5: Test It! (30 seconds)

1. Open `funding-grid.html` in your browser
2. Click any brand box
3. Fill out the form
4. Submit
5. Check your Google Sheet - your submission should appear!

---

## You're Done!

**Share your grid:**
```
Twitter: "I built 12 products. Pick one to fund: https://soulfra.github.io/funding-grid.html"

LinkedIn: "Instead of writing proposals, I'm showing proof I can execute.
12 live products proving 12 capabilities. Apply to invest: [link]"

HackerNews: Show HN: Million Dollar Grid for Open Source Products
```

---

## What Happens Next

1. **Applications flow into Google Sheet**
   - You review manually (for now)
   - Sort by amount, brand, company
   - Reach out to qualified investors

2. **Phase 2 (Optional): Cal Auto-applies**
   - Cal reads your Google Sheet
   - Sees which brands need funding
   - Automatically applies to matching opportunities:
     - SAM.gov (government contracts)
     - SBIR/STTR grants
     - VC databases
     - Angel networks
   - Logs applications back to Sheet

3. **Revenue:**
   - Land $500K SBIR grant → Build Soulfra for government
   - Land $300K seed round → Scale Calriven team
   - Land $200K contract → Deliver PitchDeck to enterprise

---

## Troubleshooting

**Form not submitting?**
- Check that form URL ends with `/formResponse` not `/viewform`
- Verify all `entry.XXXXXXXX` IDs match your form

**Sheet not updating?**
- Make sure Form → Responses → Spreadsheet is connected
- Test by submitting directly via Google Form (not through grid)

**Page not loading?**
- Check GitHub Pages is enabled in repo settings
- Wait 1-2 minutes after enabling
- Clear browser cache

---

## Next Steps (After You Have Applications)

1. **Add domain-specific pages**
   - `soulfra.com` → Shows only Soulfra box
   - `calriven.com` → Shows only Calriven box
   - All feed to same Google Sheet

2. **Build Cal Auto-Funder (Phase 2)**
   - Reads Google Sheet
   - Searches grant databases
   - Auto-fills applications
   - Submits on your behalf

3. **Add auth (if needed)**
   - Only after you have investors
   - For now, just collect emails

---

## Cost Breakdown

- Google Forms: **$0/month**
- Google Sheets: **$0/month**
- GitHub Pages: **$0/month**
- Total: **$0/month**

vs.

- Typeform Pro: $35/month
- Airtable Pro: $20/month
- Mailchimp: $30/month
- Vercel Pro: $20/month
- Total: **$105/month**

---

**Built by:** Matt Mauer (@Soulfra)
**Questions?** matt@soulfra.com
**Source:** https://github.com/Soulfra
