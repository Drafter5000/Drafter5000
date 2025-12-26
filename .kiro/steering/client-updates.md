---
inclusion: manual
---

# Client Update Generation

When the user says "create today update" or similar phrases like "generate today's update", "client update for today":

## Steps to Follow

1. Run git log to get all commits from today:

   ```
   git log --since="YYYY-MM-DD 00:00:00" --until="YYYY-MM-DD 23:59:59" --all --pretty=format:"%h %s" --name-status
   ```

2. Analyze the commits and categorize changes into these sections:
   - DESIGN SYSTEM CHANGES (if any UI/design related changes)
   - NEW FEATURES
   - IMPROVEMENTS
   - TECHNICAL UPDATES
   - FILES ADDED (if notable new files)

3. Create a .txt file in the `docs/` folder named `client-update-YYYY-MM-DD.txt`

## Output Format

```
Client Update - [Month Day, Year]
==================================

[SECTION NAME]
---------------------------------
• [Single line bullet point]
• [Single line bullet point]

[NEXT SECTION]
------------
• [Single line bullet point]
```

## Rules

- Each bullet point must be a single line
- Use • character for bullets
- Highlight any design reversions or major UI changes prominently
- Keep descriptions concise but informative for non-technical clients
- Include API endpoints in parentheses when relevant
- Group related changes together
