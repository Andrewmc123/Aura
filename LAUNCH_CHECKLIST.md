# Aura — App Store launch checklist

Everything in **Part 1** is already built and tested in the code (branch `launch-prep`).
**Part 2** is the list of things only you can do, in order.

---

## Part 1 — Done in code

| Area | What changed |
| --- | --- |
| Database | The app is ready for a permanent Postgres database. Connections recover after idle time. `/api/health` reports whether the database is reachable and whether it is permanent. |
| Uploads | Photos, videos and audio go to a cloud bucket (Cloudflare R2 / S3) when the `S3_*` settings are filled in, so they survive redeploys. |
| Account deletion | Settings › Account › Delete account now really deletes the account and everything attached to it (type DELETE to confirm). |
| Report | Report button on every post, comment, message, live stream and profile, with a list of reasons. |
| Block | Block from a post, profile or message thread. Blocked people disappear from feeds, search, comments and messages in both directions. Manage the list in Settings › Blocked accounts. |
| Content filter | Slurs and abusive phrases are rejected in posts, comments, messages, live chat, group chat, stories, usernames, bios and shop listings. Add more words with the `BLOCKED_WORDS` setting. |
| Moderation queue | `/admin/reports` (also linked in Settings for admins): dismiss a report, remove the content, or delete the offending account. Only emails in `ADMIN_EMAILS` can open it. |
| Sign-up | Date of birth with a 13+ age gate, 8+ character passwords, and a required "I agree to the Terms & Community Guidelines" checkbox. |
| Legal pages | `/privacy`, `/terms` (includes Community Guidelines) and `/support`, linked from sign-up, log-in and Settings. |
| Privacy fix | Other people's email, address, date of birth and Bolt balance were being sent to anyone who opened a profile. They are now only sent to the account owner. |
| Payments | The Bolt top-up gave free Bolts and the Shop checkout asked for a card number without charging it. Both are switched off in production until real payments are connected (see step 9). |
| Security | Cookies are HTTPS-only in production, people stay signed in between app launches, the API route list is hidden in production, and cross-site access is closed. |
| Demo data | Fake demo users and posts are no longer seeded into a real database. |
| iOS wrapper | Capacitor is installed and configured (`react-vite/capacitor.config.json`). |

Not tested yet: a real Postgres database and a real R2 bucket (neither exists yet), and the iOS build (needs a Mac).

---

## Part 2 — Your to-do list

### A. Make the server permanent (about 30 minutes)

1. **Create the database.** Sign up at [neon.tech](https://neon.tech) (free), create a project named `aura`, and copy the connection string that starts with `postgresql://`.
2. **Create the upload bucket.** In [Cloudflare](https://dash.cloudflare.com) › R2: create a bucket named `aura-media`, turn on public access (R2.dev subdomain or your own domain), and create an API token with "Object Read & Write". Note the endpoint URL, access key, secret key and public URL.
3. **Merge the `launch-prep` branch** into `main` (or tell Claude to). Render redeploys automatically.
4. **Fill in the settings in Render** › aura › Environment:

   | Key | Value |
   | --- | --- |
   | `DATABASE_URL` | the Neon connection string |
   | `FLASK_ENV` | `production` |
   | `S3_BUCKET` | `aura-media` |
   | `S3_ENDPOINT_URL` | `https://<account-id>.r2.cloudflarestorage.com` |
   | `S3_ACCESS_KEY_ID` | from the R2 token |
   | `S3_SECRET_ACCESS_KEY` | from the R2 token |
   | `S3_PUBLIC_URL` | the bucket's public address |
   | `ADMIN_EMAILS` | the email you sign up to Aura with |
   | `SUPPORT_EMAIL` | the address users should write to |

5. **Upgrade the Render plan** from Free to Starter (about $7/month) so the app doesn't sleep.
6. **Check it worked.** Open `https://<your-aura-url>/api/health`. It should say `"database": "postgresql"` and `"persistent": true`. Then create your own account, upload a video, redeploy, and confirm both are still there.

### B. Review the wording (about 20 minutes)

7. Read `/privacy` and `/terms` in the app. They are a solid starting template, not legal advice. Edit `react-vite/src/components/Legal/LegalPages.jsx` if anything doesn't match how you run Aura.
8. Decide the minimum age. It is 13 by default (`MINIMUM_AGE`). Because Aura has live video, messaging and user content, expect Apple to rate it 13+ or higher.

### C. Decide on payments

9. Choose one for version 1.0:
   - **Simplest:** launch with Bolt purchases and Shop checkout switched off (the current state). Everyone still gets starting Bolts and a free daily gift.
   - **Sell Bolts:** Apple requires In-App Purchase for digital currency. This needs products created in App Store Connect plus code for StoreKit — ask Claude to build it once your developer account exists.
   - **Shop checkout:** physical goods may use Stripe instead of Apple's system. Also needs building.

### D. Build the iOS app (needs a Mac with Xcode)

10. Join the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year).
11. In `react-vite/capacitor.config.json` replace `com.REPLACE.aura` with your bundle ID (for example `com.yourname.aura`) and `https://REPLACE-WITH-YOUR-LIVE-AURA-URL` with your live Render address.
12. On the Mac, in the `react-vite` folder, run `npm install`, then `npm run build`, then `npx cap add ios`, then `npx cap open ios`.
13. In Xcode › `Info.plist`, add these permission messages (Apple rejects apps that use the camera without them):
    - `NSCameraUsageDescription` — "Aura uses the camera to record videos, stories and live streams."
    - `NSMicrophoneUsageDescription` — "Aura uses the microphone to record sound for your videos and live streams."
    - `NSPhotoLibraryUsageDescription` — "Aura lets you pick photos and videos to post."
14. Add the app icon (1024×1024) and launch screen in Xcode, then run it on your own iPhone and test: sign up, record, upload, comment, message, report, block, delete account.

    > **Risk to know about:** the app loads your live website inside a native shell. Apple sometimes rejects apps that feel like "just a website" (guideline 4.2). Aura's camera, recording and live features help. Adding push notifications would help more — worth doing before or right after the first submission.

### E. App Store Connect

15. Create the app listing: name, subtitle, description, keywords, category (Social Networking).
16. Screenshots for the 6.9" iPhone size (taken from the simulator or your phone).
17. URLs: Privacy Policy `https://<your-aura-url>/privacy`, Support `https://<your-aura-url>/support`.
18. **App Privacy** questionnaire — declare: name, email, date of birth, photos/videos, audio, user content, messages, and usage data, all "linked to the user", none used for tracking.
19. **Age rating** questionnaire — answer honestly about user-generated content, messaging and live video.
20. **Review notes** — give Apple a test account (email + password you create) and paste this:

    > Aura includes user-generated content. Users must agree to Terms with zero tolerance for objectionable content at sign-up. Every post, comment, message, live stream and profile has a Report option; users can block other users (… menu on any profile or post); a text filter blocks abusive language; reports are reviewed within 24 hours and offending content and accounts are removed. Account deletion is in Settings › Account › Delete account.

21. Upload the build from Xcode, send it to TestFlight, test once more, then submit for review.

### F. After launch — ongoing

22. **Check `/admin/reports` every day.** Apple expects reports to be handled within 24 hours.
23. Turn on database backups in Neon and keep an eye on the Render logs for errors.
