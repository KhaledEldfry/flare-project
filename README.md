# Flare Fitness — Campaign Submission Form

## Project Structure

```
flare-project/
├── api/
│   └── submit-campaign.js    ← Vercel serverless backend (sends data to Notion)
├── public/
│   └── index.html            ← Frontend form (static HTML/CSS/JS)
├── vercel.json               ← Vercel routing config
├── package.json
├── .env.example              ← Required environment variables
└── README.md
```

## How to Deploy on Vercel

### Step 1: Push to GitHub
1. Create a new GitHub repo (e.g. `flare-campaign-form`)
2. Push this folder to it:
   ```bash
   cd flare-project
   git init
   git add .
   git commit -m "Flare campaign form"
   git remote add origin https://github.com/YOUR_USER/flare-campaign-form.git
   git push -u origin main
   ```

### Step 2: Deploy on Vercel
1. Go to https://vercel.com and sign in with GitHub
2. Click **"New Project"** → Import your repo
3. Before clicking Deploy, add **Environment Variables**:
   - `NOTION_API_KEY` = your Notion integration API key
   - `NOTION_DATABASE_ID` = `58b2c39468a946a2b22449a8ccd166b2`
4. Click **Deploy**

### Step 3: Done!
Your form will be live at `https://your-project.vercel.app`

## How It Works

1. **User** fills out the form and clicks Submit
2. **Frontend** (`public/index.html`) sends a JSON POST to `/api/submit-campaign`
3. **Backend** (`api/submit-campaign.js`) receives the data, determines the Status (Active/Scheduled/Expired), and creates a new page in the Notion database
4. **Notion Database** stores the campaign with all properties
5. **AI Agent** queries Notion for campaigns where Status = "Active"

## Status Logic

- If no Start Date OR Start Date ≤ today → **Active**
- If Start Date > today → **Scheduled**
- If End Date < today → **Expired**

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NOTION_API_KEY` | Your Notion Integration API key (starts with `ntn_`) |
| `NOTION_DATABASE_ID` | The ID of the Campaigns database in Notion |
