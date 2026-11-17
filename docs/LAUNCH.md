# OnlineLand Launch గైడ్ (Phase 8B)

ఇది మీరు laptop లో చేయవలసిన పనుల జాబితా, ఈ క్రమంలోనే చేయాలి. ప్రతి స్టెప్ పూర్తయ్యాక ☐ ని ✅ గా మార్చుకోండి.

**భద్రతా నియమాలు**
- Keys, passwords, OTPs ఎప్పుడూ chat లో పంపకండి. అవి GitHub Secrets / Vercel / Firebase లో మాత్రమే పెట్టాలి.
- ఈ పనుల్లో ఎక్కడా onlineland-28234, vahan-3e329, ridekart-70332, scraplake ప్రాజెక్ట్‌లను తెరవనవసరం లేదు, మార్చనవసరం లేదు.

---

## 1. Firebase ప్రాజెక్ట్‌లు (సుమారు 40 నిమిషాలు)

☐ **1.1** console.firebase.google.com → "Create a project" → పేరు `onlineland-dev`.
   - ఆ ID దొరకకపోతే Firebase వేరే ID ఇస్తుంది (ఉదా: `onlineland-dev-7f3a2`). ఆ ID నాకు చెప్పండి. నేను code లో అనుమతి జాబితాను మారుస్తాను.
   - Google Analytics: Off.

☐ **1.2** అదే విధంగా `onlineland-prod` తయారు చేయండి.

☐ **1.3** రెండు ప్రాజెక్ట్‌లకూ Blaze plan పెట్టండి. Billing → Budgets → ₹1,000/నెల అలర్ట్ (D2).

☐ **1.4** ప్రతి ప్రాజెక్ట్‌లో ఇవి on చేయండి:
   - **Authentication** → Sign-in method → **Phone** → Enable.
   - **Firestore** → Create database → Location **asia-south1 (Mumbai)** → **Production mode**.
   - **Storage** → Get started → అదే asia-south1.
   - **Firestore → Disaster recovery** → Point-in-time recovery ON, Daily backup ON (7 రోజులు).

☐ **1.5** Project settings → General → **Add app → Web**. పేరు "website". చూపించే config (apiKey, appId…) Vercel కోసం అవసరం (స్టెప్ 4).

☐ **1.6** Project settings → **Add app → Android**. Package name: `in.onlineland.onlineland`. API key, App ID, Sender ID స్టెప్ 2 కోసం అవసరం.

☐ **1.7** Project settings → **Service accounts** → "Generate new private key". ఒక JSON ఫైల్ download అవుతుంది.
   - ఇది **చాలా రహస్యం**. దీన్ని నేరుగా GitHub Secret లో పెట్టండి (స్టెప్ 2), తర్వాత laptop నుంచి తొలగించండి.
   - ఈ key ఆ ఒక్క ప్రాజెక్ట్‌కు మాత్రమే పనిచేస్తుంది.

## 2. GitHub Secrets (సుమారు 15 నిమిషాలు)

github.com/nageshpn999-coder/onlineland → **Settings → Secrets and variables → Actions → New repository secret**

| Secret పేరు | విలువ |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_DEV` | dev ప్రాజెక్ట్ JSON ఫైల్ మొత్తం (1.7) |
| `FIREBASE_SERVICE_ACCOUNT_PROD` | prod ప్రాజెక్ట్ JSON ఫైల్ మొత్తం |
| `FIREBASE_ANDROID_API_KEY_DEV` / `_PROD` | Android app API key (1.6) |
| `FIREBASE_ANDROID_APP_ID_DEV` / `_PROD` | Android App ID (1:…:android:…) |
| `FIREBASE_SENDER_ID_DEV` / `_PROD` | Sender ID (అంకెలు) |
| `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD` | స్టెప్ 7 లో |

☐ **2.1** Settings → **Environments** → `production` తయారు చేయండి → "Required reviewers" లో మిమ్మల్ని మీరే పెట్టుకోండి. ఇలా చేస్తే prod కు ఏ deploy జరిగినా మీ ఆమోదం అడుగుతుంది.

## 3. Backend deploy (5 నిమిషాలు, ఫోన్ నుంచి కూడా చేయవచ్చు)

☐ **3.1** GitHub → **Actions → "Deploy Firebase" → Run workflow → dev**.
   - ముందు అన్ని టెస్టులు నడుస్తాయి. అవి pass అయితేనే deploy అవుతుంది.
   - వేరే ప్రాజెక్ట్ key పెడితే workflow ఆగిపోతుంది.

☐ **3.2** Firebase → Firestore → Indexes లో అన్నీ "Enabled" అయ్యే వరకు ఆగండి (5–10 నిమిషాలు).

## 4. Vercel (సుమారు 30 నిమిషాలు)

☐ **4.1** vercel.com → GitHub తో login → **Add New Project** → `onlineland` repo.
   - Root Directory: `apps/web`
   - Production Branch: `main`
   - Preview Branch: `develop`

☐ **4.2** Environment Variables (Preview = dev విలువలు, Production = prod విలువలు):
   - `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`: web config (1.5) నుంచి.
   - `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY`: service account JSON లోని project_id, client_email, private_key.
   - `REVALIDATE_SECRET`: ఏదైనా పొడవైన random పదం.
   - `NEXT_PUBLIC_GA_ID` = `G-FS8G5F66CB`: Production కు మాత్రమే.

☐ **4.3** రెండో Vercel project: అదే repo, Root Directory `apps/admin`. Env vars: పైన ఉన్న `NEXT_PUBLIC_FIREBASE_*` మాత్రమే. Domain: `admin.onlineland.in`.

☐ **4.4** Firebase → Authentication → Settings → **Authorized domains** లో Vercel preview domain, `onlineland.in`, `admin.onlineland.in` చేర్చండి.

## 5. మొదటి admin (2 నిమిషాలు)

☐ **5.1** Vercel preview సైట్ (dev) లో మీ నంబర్ 9959731120 తో ఒకసారి లాగిన్ అవ్వండి. Admin site లో OTP పంపితే చాలు.

☐ **5.2** GitHub → Actions → **"Give a role" → dev → +919959731120 → admin**.

☐ **5.3** Admin site లో logout చేసి మళ్లీ login అవ్వండి. Dashboard తెరుచుకుంటుంది.

☐ **5.4** Admin → **ధరలు & సెట్టింగ్స్** → మీ UPI ID పెట్టి → సేవ్ చేయండి.

## 6. dev లో పూర్తి టెస్ట్ (సుమారు 1 గంట, PDF guide లోని checklist)

☐ వెబ్‌సైట్‌లో enquiry పంపండి → admin Leads లో కనిపించాలి.

☐ యాప్ (స్టెప్ 7 dev APK) లో ప్రాపర్టీ పోస్ట్ చేయండి → admin లో ఆమోదించండి → ఫోన్‌కు notification రావాలి.

☐ వేరే నంబర్‌తో యాప్‌లో Basic ప్లాన్ ఎంచుకుని, ₹499 నిజంగా UPI తో చెల్లించి UTR ఇవ్వండి → admin లో ఆమోదించండి → ప్లాన్ active అవ్వాలి. డబ్బు మీ సొంత UPI కే వెళ్తుంది.

☐ Dealer లింక్ షేర్ చేసి, వేరే ఫోన్ నుంచి enquiry పెట్టండి → "నా Leads" లో కనిపించాలి.

☐ Privacy/Terms పేజీలు, పాత visiting cards (`/c/siri/`) తెరుచుకోవాలి.

## 7. Play Store

☐ **7.1** Play Console: **Organization** account (OnlineLand Infra Private Limited, D-U-N-S నంబర్ అవసరం, $25).

☐ **7.2** **Upload key** తయారు చేయండి. ఇది ఒక్కసారే. Laptop లో Java/Android Studio ఉండాలి:
   ```
   keytool -genkeypair -v -keystore onlineland-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
   - దీని password ఎక్కడైనా సురక్షితంగా రాసి పెట్టుకోండి.
   - `base64 -w0 onlineland-upload.jks` output ను `ANDROID_KEYSTORE_BASE64` secret గా పెట్టండి. Password లు, alias (`upload`) ను మిగతా 3 secrets గా పెట్టండి.
   - .jks ఫైల్‌ను Google Drive లో private గా backup చేయండి.

☐ **7.3** GitHub → Actions → **"Android release (Play Store)" → dev** → draft release లో `.aab` వస్తుంది.

☐ **7.4** Play Console → Create app → **Internal testing** → ఆ .aab upload చేయండి. "Play App Signing" ను accept చేయండి.

☐ **7.5** Play Console → Setup → App signing → **SHA-256** ను కాపీ చేసి Firebase → Project settings → Android app → Add fingerprint లో పెట్టండి. ఇది లేకపోతే Phone OTP పనిచేయదు.

☐ **7.6** Store listing, Data safety, Content rating: `docs/PLAY_STORE.md` లోని జవాబులు కాపీ చేయండి. Graphics `docs/store/` లో ఉన్నాయి. Screenshots యాప్ నుంచి తీసుకోండి.

## 8. App Check (spam/bot రక్షణ)

☐ **8.1** Firebase → App Check → Web app → **reCAPTCHA Enterprise** → site key తయారు చేయండి. ఆ key ను Vercel (రెండు projects) లో `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` గా పెట్టండి.

☐ **8.2** App Check → Android app → **Play Integrity** → register.

☐ **8.3** ఒక వారం App Check → Metrics చూడండి. "Verified requests" దాదాపు 100% అయ్యాక Firestore, Storage, Functions లకు **Enforce** నొక్కండి. Functions కోసం నాకు చెప్పండి, నేను `ENFORCE_APP_CHECK=true` పెట్టి deploy చేస్తాను.

## 9. Launch రోజు (prod)

☐ 3.1 ను **prod** తో చేయండి, తర్వాత 5.1–5.4 ను prod సైట్‌లో చేయండి.

☐ `develop` → `main` merge కోసం నాకు చెప్పండి. నేను PR తయారు చేస్తాను, మీరు ఆమోదిస్తారు.

☐ Domain provider లో `onlineland.in` DNS ను Vercel కు మార్చండి (Vercel చూపించే A/CNAME records). `admin` కు CNAME.

☐ 24 గంటలు ఇవి చెక్ చేయండి: `onlineland.in/te`, `onlineland.in/c/siri/`, `onlineland.in/blog.html`, Google Search Console లో `sitemap.xml` submit చేయండి.

☐ Play Console → Internal testing నుంచి **Production** కు promote చేయండి.

## 10. పాత డేటా (మీ నిర్ణయం కావాలి)

పాత onlineland-28234 లోని `listings` ను కొత్త సైట్‌లోకి తీసుకురావాలంటే మూడు దారులు ఉన్నాయి:
- **(a)** మీరు అనుమతి ఇస్తే, నేను **చదవడం మాత్రమే** చేసే script రాస్తాను. అది పాత ప్రాజెక్ట్‌లో ఏమీ మార్చదు. దాన్ని మీరు ఒకసారి నడపాలి.
- **(b)** Admin లో చేతితో మళ్లీ పోస్ట్ చేయడం (listings తక్కువగా ఉంటే).
- **(c)** పాతవి వదిలేయడం.

Blog (`blog.html`) ప్రస్తుతం ఉన్నట్టే పాత ప్రాజెక్ట్ నుంచి చదువుతుంది. దాన్ని మేము మార్చలేదు.
