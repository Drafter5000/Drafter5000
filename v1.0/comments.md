# Comments v1.0

1. Addition of a column ''Job'' in Main Sheet (we'll get that data in step 3)

2. When creating an account, the page that says ''check your email to confirm'' should remain on screen. Not auto-go back to Login.

3. When trying to login before confirming email, the red message should read ''Please confirm your email by ''Email not verified. Check your inbox for the verification link.'' instead of ''Email not confirmed''

4. The flow should be: Landing Page - Step 1 - Step 2 - Step 3 (account creation/payment/preference setting)

5. When you first log-in, the landing page is the dashboard. The logic should be ''Was step 1-2-3 done, if yes -> dashboard. If no -> Step 1-2-3.

6. Dashboard: The user should see
   - List of article topic, with a icon indicating the status between (needs draft/sent) (result of step 2)
   - List of articles drafted (status <<sent>>) (result of end of workflow)
   - Preference modification (modificaiton of step 1-2-3) \*itn

7. Customers should only have 1 row in the Excel ''Main Sheet''. When that row is created, a new page should be created in the Excel ''Customers'' with the sheet name = to the column ''sheet name'' in ''Maint Sheet''.

8. Step 2 of 3, ''your topic'': There should be 1 topic example provided for the user to know the format to use. Like
   - "Why Follow-Ups Fail When Reps Only 'Check In'—And a Repeatable Formula for Follow-Ups That Actually Move Deals Forward"; or
   - "Why Sales Reps Lose High-Intent Prospects When They Pitch Too Early—And a Simple Cue That Tells You the Prospect Is Ready"

9. Step 2 logic:
   - The prompt for the AI should be something like: ''You're a linkedin topic drafter. Your job is to act as a [insert variable <<job>>], look at the topic ideas already drafted here [insert variable topic ideas] and generate 10 more like it that are different enough to be novel.
   - ''The [insert variable topic ideas] should be the topics on the left. E.g., if I write manually <<Topic Banana, Topic Apple and Topic Orange>>, the AI should give me a list of 10 new fruits that are different from banana apple and orange.
   - From what I understand, it already plays with those variables, but it should not refer to the ''Writing style''.
   - I'd love a way to modify and play with that prompt, because its something that I'll have to optimize.

10. Step 2 information, should appear in the spreadsheet ''Customers'' under the correct page for that customer. The status should be ''Needs Draft''

11. Step 3: ''Style name'' can be removed. Only 1 style per customer for now.

12. Step 3: ''Your information'', the customer should have the opportunity to use the information provided in signup instead of having to write it again.

13. Step 3: Language, only English and French for now.

14. Step 3: Add ''job title (with a information bubble the user can view that says something like ''the AI will draft as if he was doing that job')

15. ''Forgot my password'' button

16. Question: would it be hard to have a ''log in with LinkedIn'' button? I feel like that would be the best for the user experience and it would give us great data.

17. The Main Sheet didnt update when I created the account and finished step 1-2-3
