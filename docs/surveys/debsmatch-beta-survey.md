# DebsMatch Beta Testers Survey – Google Forms Spec

Use this spec to build a Google Form. Question types, options, required flags, and branching are included. Estimated time: 7–10 minutes.

Title: DebsMatch Beta Feedback Survey (v1)

Form Description:
- Thanks for testing DebsMatch! This survey collects focused feedback across onboarding, profile setup, swiping, likes, chat, filters, and safety. Please answer based on your actual experience using the app for at least one session. If you hit bugs, mention them in the Open Feedback section. Screenshots or videos are welcome if you can share them separately.
- Data use: Responses help improve the product. Do not include sensitive personal information.

Settings Recommendations:
- Collect email addresses: Off (or On if you want to follow up directly)
- Limit to 1 response: On (recommended)
- Progress bar: On
- Shuffle question order: Off
- Show link to submit another response: Off

Sections Overview:
1) Consent & Device Info
2) Onboarding Experience
3) Profile Setup & Editing
4) Swiping & Discovery
5) Likes
6) Chat & Messaging
7) Filters
8) Safety & Reporting
9) Notifications
10) Performance & Stability
11) Overall Satisfaction
12) Open Feedback & Contact

Branching Rules (Go to section based on answer):
- If Q1 (Consent) = “I do not consent” → Submit form (end).
- If section usage questions = “Did not use” → Skip the corresponding section and continue to next relevant section.

---

## 1) Consent & Device Info

Q1. Consent to participate
- Type: Multiple choice
- Options: [I consent to participate in this beta and share feedback], [I do not consent]
- Required: Yes
- Logic: If “I do not consent” → Submit form.

Q2. Your tester email (for follow-up and bug clarifications)
- Type: Short answer
- Validation: Must contain “@”
- Required: Optional

Q3. Device OS
- Type: Multiple choice
- Options: [iOS], [Android]
- Required: Yes

Q4. Device model and OS version
- Type: Short answer
- Help text: e.g., “iPhone 13, iOS 17.5” or “Pixel 7, Android 14”
- Required: Yes

Q5. App install method
- Type: Multiple choice
- Options: [TestFlight], [Android APK], [Expo Go], [Other]
- Required: Yes

Q6. Network conditions
- Type: Multiple choice
- Options: [Mostly Wi‑Fi], [Mostly 4G/5G], [Mixed]
- Required: Yes

---

## 2) Onboarding Experience

Gate: “Did you complete the onboarding flow at least once?”
- Type: Multiple choice
- Options: [Yes, fully], [Partially], [Did not start]
- Required: Yes
- Logic: If “Did not start” → Go to Section 3 (Profile Setup & Editing) if they edited later, else continue to Section 4.

Q7. Overall, how easy was onboarding?
- Type: Linear scale (1–5)
- Labels: 1 = Very difficult, 5 = Very easy
- Required: Yes

Q8. Which steps felt unclear or unnecessary? (select all that apply)
- Type: Checkbox
- Options: [Email verification], [Date of birth], [School selection], [Gender], [Gender preference], [Debs preferences], [Relationship status], [Dating intentions], [Interests], [Profile prompts], [Photo upload], [Notifications], [Legal agreements], [Community guidelines], [Password creation], [None]
- Required: No

Q9. Clarity of copywriting during onboarding
- Type: Linear scale (1–5)
- Labels: 1 = Very unclear, 5 = Very clear
- Required: Yes

Q10. Onboarding pacing and length felt right
- Type: Linear scale (1–5)
- Labels: 1 = Far too long, 5 = Just right
- Required: Yes

Q11. “Debs” preferences and intents were easy to understand
- Type: Linear scale (1–5)
- Labels: 1 = Not at all, 5 = Completely
- Required: Yes

Q12. Did you encounter any blockers or bugs during onboarding?
- Type: Paragraph
- Required: No

---

## 3) Profile Setup & Editing

Gate: “Did you edit your profile (bio, prompts, photos)?”
- Type: Multiple choice
- Options: [Yes], [No]
- Required: Yes
- Logic: If “No” → Go to Section 4

Q13. Profile editing was easy to find and use
- Type: Linear scale (1–5)
- Labels: 1 = Strongly disagree, 5 = Strongly agree
- Required: Yes

Q14. The categories and prompts felt relevant
- Type: Linear scale (1–5)
- Labels: 1 = Not relevant, 5 = Very relevant
- Required: Yes

Q15. Photo upload experience
- Type: Multiple choice
- Options: [Smooth], [Okay], [Slow], [Confusing], [Buggy]
- Required: Yes

Q16. Minimum photos and validation felt reasonable
- Type: Linear scale (1–5)
- Labels: 1 = Not reasonable, 5 = Very reasonable
- Required: Yes

Q17. What was hard or missing in profile editing?
- Type: Paragraph
- Required: No

---

## 4) Swiping & Discovery

Gate: “Did you use the main swiping screen?”
- Type: Multiple choice
- Options: [Yes], [No]
- Required: Yes
- Logic: If “No” → Go to Section 5

Q18. Profiles loaded quickly when swiping
- Type: Linear scale (1–5)
- Labels: 1 = Very slow, 5 = Very fast
- Required: Yes

Q19. Card animations and haptics felt great
- Type: Linear scale (1–5)
- Labels: 1 = Poor, 5 = Excellent
- Required: Yes

Q20. Information on the card was clear and helpful (age, school, interests, prompts)
- Type: Linear scale (1–5)
- Labels: 1 = Not clear, 5 = Very clear
- Required: Yes

Q21. Filter button and filters were discoverable
- Type: Linear scale (1–5)
- Labels: 1 = Not discoverable, 5 = Very discoverable
- Required: Yes

Q22. Did you experience any issues with like/pass actions, match notifications, or profile photos?
- Type: Paragraph
- Required: No

Q23. Reporting a profile felt straightforward (if used)
- Type: Linear scale (1–5)
- Labels: 1 = Very confusing, 5 = Very straightforward
- Required: No

---

## 5) Likes

Gate: “Did you open Likes and review people who liked you?”
- Type: Multiple choice
- Options: [Yes], [No]
- Required: Yes
- Logic: If “No” → Go to Section 6

Q24. It’s clear how to like back or pass from Likes
- Type: Linear scale (1–5)
- Labels: 1 = Not clear, 5 = Very clear
- Required: Yes

Q25. The information shown (name, age, recency) was sufficient
- Type: Linear scale (1–5)
- Labels: 1 = Insufficient, 5 = Sufficient
- Required: Yes

Q26. Any issues refreshing Likes or creating matches from Likes?
- Type: Paragraph
- Required: No

---

## 6) Chat & Messaging

Gate: “Did you match with someone and open a chat?”
- Type: Multiple choice
- Options: [Yes], [No]
- Required: Yes
- Logic: If “No” → Go to Section 7

Q27. It was easy to find and open chats
- Type: Linear scale (1–5)
- Labels: 1 = Difficult, 5 = Very easy
- Required: Yes

Q28. Message sending felt reliable (no failures or duplicates)
- Type: Linear scale (1–5)
- Labels: 1 = Not reliable, 5 = Very reliable
- Required: Yes

Q29. Message delivery speed was acceptable
- Type: Linear scale (1–5)
- Labels: 1 = Very slow, 5 = Very fast
- Required: Yes

Q30. Conversation list (names, last message, time, unread badges) was clear
- Type: Linear scale (1–5)
- Labels: 1 = Not clear, 5 = Very clear
- Required: Yes

Q31. Any bugs or confusion in chats (typing indicators, unread counts, navigation)?
- Type: Paragraph
- Required: No

---

## 7) Filters

Gate: “Did you use filters (gender, schools, counties, looking for, intentions, relationship status)?”
- Type: Multiple choice
- Options: [Yes], [No]
- Required: Yes
- Logic: If “No” → Go to Section 8

Q32. Filters covered what you needed
- Type: Linear scale (1–5)
- Labels: 1 = Missing a lot, 5 = Complete
- Required: Yes

Q33. Filter UI was clear and easy to use
- Type: Linear scale (1–5)
- Labels: 1 = Not clear, 5 = Very clear
- Required: Yes

Q34. Did “Debs” specific options make sense (Go to someone’s debs, Bring someone to my debs, Swaps)?
- Type: Linear scale (1–5)
- Labels: 1 = Not at all, 5 = Completely
- Required: Yes

Q35. What filters felt missing or confusing?
- Type: Paragraph
- Required: No

---

## 8) Safety & Reporting

Q36. I felt safe using DebsMatch
- Type: Linear scale (1–5)
- Labels: 1 = Not safe, 5 = Very safe
- Required: Yes

Q37. Reporting a profile felt accessible and fair
- Type: Linear scale (1–5)
- Labels: 1 = Poor, 5 = Excellent
- Required: Yes

Q38. Any concerns about fake accounts or inappropriate content?
- Type: Paragraph
- Required: No

---

## 9) Notifications

Q39. Did you enable notifications during onboarding?
- Type: Multiple choice
- Options: [Yes], [No], [Not asked / Don’t remember]
- Required: Yes

Q40. If enabled, were notifications timely and useful?
- Type: Linear scale (1–5)
- Labels: 1 = Not useful, 5 = Very useful
- Required: No

Q41. Anything to improve about notifications?
- Type: Paragraph
- Required: No

---

## 10) Performance & Stability

Q42. Overall performance
- Type: Linear scale (1–5)
- Labels: 1 = Very laggy, 5 = Very smooth
- Required: Yes

Q43. Did the app crash or freeze at any point?
- Type: Multiple choice
- Options: [No], [Yes – once], [Yes – multiple times]
- Required: Yes

Q44. Where did you notice slowdowns? (select all that apply)
- Type: Checkbox
- Options: [Onboarding], [Photo upload], [Swiping], [Loading photos], [Likes], [Chats], [Filters], [Opening app], [Other]
- Required: No

Q45. If you saw errors, describe what happened (include steps to reproduce if possible)
- Type: Paragraph
- Required: No

---

## 11) Overall Satisfaction

Q46. How satisfied are you with DebsMatch overall?
- Type: Linear scale (1–5)
- Labels: 1 = Not satisfied, 5 = Very satisfied
- Required: Yes

Q47. How likely are you to recommend DebsMatch to a friend going to a debs?
- Type: Linear scale (0–10) [NPS]
- Labels: 0 = Not at all likely, 10 = Extremely likely
- Required: Yes

Q48. Which three aspects did you like most?
- Type: Paragraph
- Required: No

Q49. Top three things to improve next
- Type: Paragraph
- Required: No

---

## 12) Open Feedback & Contact

Q50. Anything else you want us to know?
- Type: Paragraph
- Required: No

Q51. Are you open to a 15‑minute follow‑up call?
- Type: Multiple choice
- Options: [Yes], [No]
- Required: No

Q52. If yes, share your preferred contact method
- Type: Short answer
- Required: No

---

Implementation Notes for Google Forms:
- To add branching: In each Gate question (multiple choice), use “Go to section based on answer” and route “No/Did not use” to the next major section.
- Make Q1 required and set “I do not consent” to submit form.
- Consider enabling file upload if your org allows, to capture screenshots for bug reports.
- Keep linear scales consistent to aid analysis.
- Export results to Sheets; map sections to tabs for triage.

