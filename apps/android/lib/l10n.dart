/// App text in Telugu and English. Same wording as the website (apps/web/messages).
class S {
  const S(this.te);
  final bool te;
  String _(String t, String e) => te ? t : e;

  // brand / general
  String get tagline => _('మీకు సరైన ఆస్తిని కనుగొనండి', 'Find your perfect property');
  String get demoBanner => _('డెమో వెర్షన్: నమూనా ఆస్తులు, ఏ data save అవ్వదు', 'Demo version: sample listings, nothing is saved');
  String get retry => _('మళ్ళీ ప్రయత్నించండి', 'Try again');
  String get loadError => _('ఆస్తులు లోడ్ కాలేదు. Internet చెక్ చేసి మళ్ళీ ప్రయత్నించండి.', "Couldn't load properties. Check your internet and try again.");
  String get cancel => _('రద్దు', 'Cancel');
  String get close => _('మూసివేయండి', 'Close');
  String get yes => _('ఉంది', 'Yes');
  String get no => _('లేదు', 'No');

  // onboarding
  String get chooseLanguage => _('భాష ఎంచుకోండి', 'Choose your language');
  String get onb1Title => _('తెలంగాణ అంతటా ఆస్తులు', 'Properties across Telangana');
  String get onb1Body => _('వ్యవసాయ భూములు, ఓపెన్ ప్లాట్లు, ఇళ్లు. OnlineLand ఆమోదించినవి మాత్రమే.', 'Agricultural land, open plots and homes. Only listings approved by OnlineLand.');
  String get onb2Title => _('పత్రాల నుంచి సైట్ విజిట్ వరకు', 'From documents to site visit');
  String get onb2Body => _('WhatsApp లో అడగండి, విజిట్ బుక్ చేయండి. మా team మీతో ఉంటుంది.', 'Ask on WhatsApp or book a visit. Our team stays with you.');
  String get onb3Title => _('మీ భూమి అమ్మండి', 'Sell your land');
  String get onb3Body => _('ఫోటోలు, location తో ఇక్కడే post చేయండి. పరిశీలించిన తర్వాత అందరికీ కనిపిస్తుంది.', 'Post with photos and location. It goes live after our review.');
  String get next => _('తర్వాత', 'Next');
  String get start => _('మొదలుపెట్టండి', 'Get started');

  // tabs
  String get tabHome => _('హోమ్', 'Home');
  String get tabSearch => _('ఆస్తులు', 'Properties');
  String get tabSaved => _('సేవ్', 'Saved');
  String get tabSell => _('అమ్మండి', 'Sell');
  String get tabProfile => _('ప్రొఫైల్', 'Profile');

  // home
  String get searchHint => _('భూమి, ప్లాట్, ఇల్లు వెతకండి', 'Search land, plots, homes');
  String get whatLooking => _('ఏ రకమైన ఆస్తి కావాలి?', 'What are you looking for?');
  String get featured => _('ఎంపిక చేసిన ఆస్తులు', 'Featured properties');
  String get viewAll => _('అన్నీ చూడండి', 'View all');
  String get sellBandTitle => _('మీ భూమి లేదా ఇల్లు అమ్మాలనుకుంటున్నారా?', 'Want to sell your land or home?');
  String get sellBandCta => _('ఆస్తి post చేయండి', 'Post a property');

  // listings / filters
  String get buy => _('కొనుగోలు', 'Buy');
  String get rent => _('అద్దె', 'Rent');
  String get filters => _('ఫిల్టర్లు', 'Filters');
  String get type => _('ఆస్తి రకం', 'Property type');
  String get anyType => _('అన్ని రకాలు', 'All types');
  String get district => _('జిల్లా', 'District');
  String get anyDistrict => _('అన్ని జిల్లాలు', 'All districts');
  String get mandal => _('మండలం', 'Mandal');
  String get anyMandal => _('అన్ని మండలాలు', 'All mandals');
  String get budget => _('బడ్జెట్', 'Budget');
  String get anyBudget => _('ఏదైనా', 'Any');
  String get sort => _('క్రమం', 'Sort by');
  String get sortNewest => _('కొత్తవి ముందు', 'Newest first');
  String get sortPriceAsc => _('తక్కువ ధర ముందు', 'Price: low to high');
  String get sortPriceDesc => _('ఎక్కువ ధర ముందు', 'Price: high to low');
  String get clearAll => _('అన్నీ తొలగించండి', 'Clear all');
  String get showResults => _('చూపించండి', 'Show results');
  String count(int n) => te ? (n == 0 ? 'ఆస్తులు లేవు' : (n == 1 ? '1 ఆస్తి' : '$n ఆస్తులు')) : (n == 0 ? 'No properties' : (n == 1 ? '1 property' : '$n properties'));
  String get emptyTitle => _('మీ వెతుకులాటకు సరిపోయే ఆస్తులు ఇప్పుడు లేవు', 'No properties match your search right now');
  String get emptyBody => _('మీ అవసరం WhatsApp లో చెప్పండి. సరిపోయే ఆస్తులు వెతికి పంపుతాం.', "Tell us what you need on WhatsApp and we'll find matching properties.");
  String get askWhatsapp => _('WhatsApp లో అడగండి', 'Ask on WhatsApp');
  String emptyMessage(String q) => _('నమస్తే OnlineLand, నాకు ఆస్తి కావాలి: $q', "Hello OnlineLand, I'm looking for a property: $q");
  String get forSale => _('అమ్మకానికి', 'For sale');
  String get forRent => _('అద్దెకు', 'For rent');
  String get perMonth => _('నెలకు', 'per month');

  // property page
  String get total => _('మొత్తం ధర', 'Total price');
  String get code => _('ఆస్తి కోడ్', 'Property code');
  String get details => _('వివరాలు', 'Details');
  String get category => _('రకం', 'Type');
  String get area => _('విస్తీర్ణం', 'Area');
  String get location => _('ప్రాంతం', 'Location');
  String get facing => _('ముఖం', 'Facing');
  String get road => _('రోడ్డు సౌకర్యం', 'Road access');
  String get water => _('నీటి వసతి', 'Water');
  String get docs => _('పత్రాలు', 'Documents');
  String get docsVerified => _('OnlineLand పరిశీలించింది', 'Checked by OnlineLand');
  String get about => _('ఆస్తి గురించి', 'About this property');
  String get openMap => _('Google Maps లో చూడండి', 'Open in Google Maps');
  String get whatsapp => 'WhatsApp';
  String get call => _('కాల్ చేయండి', 'Call');
  String waMessage(String code, String title) => _('నమస్తే OnlineLand, ఆస్తి $code గురించి వివరాలు కావాలి: $title', "Hello OnlineLand, I'd like details about property $code: $title");
  String photo(int n, int total) => _('ఫోటో $n / $total', 'Photo $n of $total');
  String get noPhotos => _('ఫోటోలు త్వరలో', 'Photos coming soon');
  String get save => _('సేవ్ చేయండి', 'Save');
  String get saved => _('సేవ్ అయ్యింది', 'Saved');
  String get notFound => _('ఈ ఆస్తి ఇప్పుడు అందుబాటులో లేదు', 'This property is no longer available');
  String facingName(String f) => switch (f) {
        'east' => _('తూర్పు', 'East'),
        'west' => _('పడమర', 'West'),
        'north' => _('ఉత్తరం', 'North'),
        'south' => _('దక్షిణం', 'South'),
        'north-east' => _('ఈశాన్యం', 'North-east'),
        'north-west' => _('వాయువ్యం', 'North-west'),
        'south-east' => _('ఆగ్నేయం', 'South-east'),
        'south-west' => _('నైరుతి', 'South-west'),
        _ => f,
      };

  // enquiry / visit
  String get askDetails => _('వివరాలు అడగండి', 'Ask for details');
  String get bookVisit => _('సైట్ విజిట్ బుక్ చేయండి', 'Book a site visit');
  String get visitLead => _('మా team మీతో కలిసి స్థలానికి వచ్చి హద్దులు చూపిస్తుంది.', 'Our team will walk the property with you and show the boundaries.');
  String get yourName => _('మీ పేరు', 'Your name');
  String get mobile => _('మొబైల్ నంబర్', 'Mobile number');
  String get messageOptional => _('సందేశం (ఐచ్ఛికం)', 'Message (optional)');
  String get sendEnquiry => _('Enquiry పంపండి', 'Send enquiry');
  String get sending => _('పంపుతోంది…', 'Sending…');
  String get enquirySent => _('మీ enquiry అందింది. మా team త్వరలో మీకు కాల్ చేస్తుంది.', 'Enquiry received. Our team will call you shortly.');
  String get invalidPhone => _('సరైన 10 అంకెల మొబైల్ నంబర్ ఇవ్వండి (6, 7, 8 లేదా 9 తో మొదలయ్యేది).', 'Enter a valid 10-digit mobile number (starting with 6, 7, 8 or 9).');
  String get sendError => _('పంపడం కుదరలేదు. Internet చెక్ చేసి మళ్ళీ ప్రయత్నించండి, లేదా WhatsApp చేయండి.', "Couldn't send. Check your internet and try again, or message us on WhatsApp.");
  String get privacy => _('మీ నంబర్ OnlineLand team కి మాత్రమే కనిపిస్తుంది.', 'Only the OnlineLand team sees your number.');
  String get date => _('తేదీ', 'Date');
  String get slot => _('సమయం', 'Time');
  String slotName(String s) => switch (s) {
        'morning' => _('ఉదయం (9–12)', 'Morning (9–12)'),
        'afternoon' => _('మధ్యాహ్నం (12–3)', 'Afternoon (12–3)'),
        _ => _('సాయంత్రం (3–6)', 'Evening (3–6)'),
      };
  String get bookVisitButton => _('విజిట్ బుక్ చేయండి', 'Book visit');
  String get visitSent => _('మీ విజిట్ request అందింది. తేదీ confirm చేయడానికి మేము కాల్ చేస్తాం.', "Visit request received. We'll call you to confirm the date.");
  String get nameRequired => _('మీ పేరు రాయండి.', 'Enter your name.');

  // favorites
  String get savedTitle => _('సేవ్ చేసిన ఆస్తులు', 'Saved properties');
  String get savedEmptyTitle => _('ఇంకా ఏ ఆస్తీ సేవ్ చేయలేదు', "You haven't saved any properties yet");
  String get savedEmptyBody => _('ఆస్తి పక్కన ఉన్న ♡ నొక్కితే అది ఇక్కడ కనిపిస్తుంది.', 'Tap ♡ on a property and it will appear here.');
  String get remove => _('తీసేయండి', 'Remove');

  // login
  String get login => _('లాగిన్', 'Log in');
  String get loginTitle => _('మొబైల్ నంబర్‌తో లాగిన్', 'Log in with your mobile');
  String get loginWhy => _('ఆస్తి post చేయడానికి, సేవ్ చేసినవి అన్ని ఫోన్లలో చూడడానికి లాగిన్ అవసరం. చూడడానికి అవసరం లేదు.', 'Login is needed to post a property and keep saved items across phones. Browsing needs no login.');
  String get sendOtp => _('OTP పంపండి', 'Send OTP');
  String otpSentTo(String p) => _('$p కి OTP పంపాం', 'OTP sent to $p');
  String get enterOtp => _('6 అంకెల OTP', '6-digit OTP');
  String get verify => _('లాగిన్ అవ్వండి', 'Log in');
  String get wrongOtp => _('OTP తప్పు. మళ్ళీ చూసి ఇవ్వండి.', 'Wrong OTP. Check and try again.');
  String get otpError => _('OTP పంపడం కుదరలేదు. కొంత సేపు తర్వాత మళ్ళీ ప్రయత్నించండి.', "Couldn't send the OTP. Try again in a while.");
  String get demoOtpHint => _('డెమో: ఏ నంబర్ అయినా, OTP 123456', 'Demo: any number, OTP 123456');
  String get logout => _('లాగ్ అవుట్', 'Log out');
  String get changeNumber => _('నంబర్ మార్చండి', 'Change number');

  // sell
  String get sellTitle => _('ఆస్తి అమ్మండి', 'Sell a property');
  String get sellLoginFirst => _('ఆస్తి post చేయడానికి ముందు లాగిన్ అవ్వండి.', 'Log in first to post a property.');
  String get becomeOwnerTitle => _('మీరు ఆస్తి యజమానా?', 'Are you a property owner?');
  String get becomeOwnerBody => _('Owner గా మారితే మీ ఆస్తులు post చేయవచ్చు. ప్రతి ఆస్తిని OnlineLand పరిశీలించాకే అందరికీ కనిపిస్తుంది.', 'As an owner you can post your properties. Each one goes live after OnlineLand reviews it.');
  String get becomeOwner => _('అవును, owner గా మారండి', 'Yes, I am an owner');
  String get agentsCannotPost => _('Agents ఆస్తులు post చేయలేరు.', 'Agents cannot post properties.');
  String get photos => _('ఫోటోలు', 'Photos');
  String photosHint(int n) => _('$n / 20 ఫోటోలు. మొదటిది cover ఫోటో.', '$n / 20 photos. The first is the cover.');
  String get camera => _('కెమెరా', 'Camera');
  String get gallery => _('గ్యాలరీ', 'Gallery');
  String get titleLabel => _('శీర్షిక (ఉదా. బోర్‌వెల్ ఉన్న వ్యవసాయ భూమి)', 'Title (e.g. Farmland with borewell)');
  String get descriptionLabel => _('వివరాలు (నేల, నీరు, రోడ్డు…)', 'Description (soil, water, road…)');
  String get price => _('ధర (₹)', 'Price (₹)');
  String get priceBasis => _('ధర ఎలా', 'Price is');
  String get basisTotal => _('మొత్తం', 'Total');
  String get basisPerUnit => _('యూనిట్‌కు', 'Per unit');
  String get basisPerMonth => _('నెలకు', 'Per month');
  String get areaValue => _('విస్తీర్ణం', 'Area');
  String get unit => _('యూనిట్', 'Unit');
  String get village => _('ఊరు / కాలనీ', 'Village / colony');
  String get mandalText => _('మండలం పేరు', 'Mandal name');
  String get gps => _('ఇప్పుడున్న చోటు (GPS)', 'Use my current location (GPS)');
  String gpsSet(double lat, double lng) => _('Location సెట్ అయ్యింది: ${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}', 'Location set: ${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}');
  String get gpsOff => _('ఫోన్‌లో Location on చేసి, అనుమతి ఇవ్వండి.', 'Turn on Location and allow access.');
  String get ownerName => _('యజమాని పేరు (మాకు మాత్రమే)', 'Owner name (only for us)');
  String get ownerPhone => _('యజమాని నంబర్ (మాకు మాత్రమే, బయటికి కనిపించదు)', "Owner's number (only for us, never shown)");
  String get submit => _('పరిశీలనకు పంపండి', 'Submit for review');
  String uploading(int d, int t) => _('ఫోటోలు upload అవుతున్నాయి $d / $t', 'Uploading photos $d / $t');
  String get submitted => _('మీ ఆస్తి పరిశీలనకు వెళ్ళింది. ఆమోదించగానే notification వస్తుంది.', "Your property was sent for review. You'll get a notification when it's approved.");
  String get needPhoto => _('కనీసం ఒక ఫోటో జోడించండి.', 'Add at least one photo.');
  String get needTitle => _('శీర్షిక రాయండి.', 'Enter a title.');
  String get needPrice => _('సరైన ధర ఇవ్వండి.', 'Enter a valid price.');
  String get needArea => _('సరైన విస్తీర్ణం ఇవ్వండి.', 'Enter a valid area.');
  String get submitError => _('పంపడం కుదరలేదు. Internet చెక్ చేసి మళ్ళీ ప్రయత్నించండి.', "Couldn't submit. Check your internet and try again.");

  // my listings / profile
  String get myListings => _('నా ఆస్తులు', 'My properties');
  String get myListingsEmpty => _('మీరు ఇంకా ఏ ఆస్తీ post చేయలేదు.', "You haven't posted any property yet.");
  String statusName(String s) => switch (s) {
        'draft' => _('డ్రాఫ్ట్', 'Draft'),
        'pending' => _('పరిశీలనలో ఉంది', 'Under review'),
        'approved' => _('ఆమోదించారు', 'Approved'),
        'rejected' => _('తిరస్కరించారు', 'Rejected'),
        'sold' => _('అమ్ముడైంది', 'Sold'),
        'rented' => _('అద్దెకు ఇచ్చారు', 'Rented'),
        'expired' => _('గడువు ముగిసింది', 'Expired'),
        _ => s,
      };
  String rejectReason(String r) => _('కారణం: $r', 'Reason: $r');
  String get language => _('భాష', 'Language');
  String get contactUs => _('OnlineLand ని సంప్రదించండి', 'Contact OnlineLand');
  String get office => _('మక్తల్, నారాయణపేట జిల్లా, తెలంగాణ', 'Makthal, Narayanpet District, Telangana');
  String role(String r) => switch (r) {
        'owner' => _('యజమాని', 'Owner'),
        'dealer' => _('డీలర్', 'Dealer'),
        'agent' => _('ఏజెంట్', 'Agent'),
        'admin' => _('అడ్మిన్', 'Admin'),
        _ => _('కొనుగోలుదారు', 'Buyer'),
      };

  // plans, payments, dealer leads (Phase 7, decision D7)
  String get myPlan => _('నా ప్లాన్', 'My plan');
  String get myLeads => _('నా Leads', 'My leads');
  String get currentPlan => _('ప్రస్తుత ప్లాన్', 'Current plan');
  String get freePlanNow => _('మీరు ఉచిత ప్లాన్‌లో ఉన్నారు.', 'You are on the free plan.');
  String validTill(String date) => _('$date వరకు active', 'Active until $date');
  String get choosePlan => _('ఈ ప్లాన్ తీసుకోండి', 'Choose this plan');
  String get renewPlan => _('Renew చేయండి', 'Renew');
  String pricePerMonth(String price) => _('$price / నెల', '$price / month');
  String listingsN(int n) => n == 0 ? _('అపరిమిత listings', 'Unlimited listings') : _('$n listings', '$n listings');
  String get featOwnNumber => _('షేర్ లింక్‌లో మీ సొంత నంబర్', 'Your own number on shared links');
  String get featBadge => _('✓ Verified బ్యాడ్జ్', '✓ Verified badge');
  String get featStats => _('Views, enquiries లెక్కలు', 'Views and enquiry stats');
  String get featLeads => _('మీ లింక్ ద్వారా వచ్చిన leads', 'Leads from your links');
  String featFeatured(int n) => _('నెలకు $n featured listings', '$n featured listings a month');
  String get featDealerPage => _('సొంత dealer పేజీ', 'Your own dealer page');
  String get featAreaLeads => _('మీ ఏరియా leads కూడా', 'Leads in your area too');
  String payFor(String what, String amount) => _('$what — $amount', '$what — $amount');
  String get payStep1 => _('1. UPI తో చెల్లించండి', '1. Pay by UPI');
  String get payStep2 => _('2. UTR నంబర్ ఇవ్వండి', '2. Enter the UTR number');
  String get payWithUpi => _('UPI యాప్‌తో చెల్లించండి', 'Pay with a UPI app');
  String get upiCopied => _('UPI ID కాపీ అయింది', 'UPI ID copied');
  String get noUpiYet => _('చెల్లింపు వివరాల కోసం WhatsApp చేయండి.', 'WhatsApp us for payment details.');
  String get utrLabel => _('UTR / Reference నంబర్ (12 అంకెలు)', 'UTR / reference number (12 digits)');
  String get utrHelp => _('చెల్లించిన తర్వాత GPay/PhonePe లో "UPI Ref No" చూడండి.', 'After paying, find "UPI Ref No" in GPay/PhonePe.');
  String get utrInvalid => _('12 అంకెల UTR నంబర్ ఇవ్వండి.', 'Enter the 12-digit UTR number.');
  String get sendPayment => _('చెల్లింపు వివరాలు పంపండి', 'Send payment details');
  String get paymentSent => _('అందింది! OnlineLand చెక్ చేసి ఆమోదించగానే notification వస్తుంది.', "Received! You'll get a notification once OnlineLand confirms it.");
  String get paymentSentDemo => _('డెమో: చెల్లింపు వెంటనే ఆమోదించబడింది.', 'Demo: payment approved at once.');
  String get paymentHistory => _('చెల్లింపులు', 'Payments');
  String payStatus(String st) => switch (st) {
        'approved' => _('ఆమోదించారు', 'Approved'),
        'rejected' => _('తిరస్కరించారు', 'Rejected'),
        _ => _('చెక్ చేస్తున్నాం', 'Being checked'),
      };
  String payKind(String k) => switch (k) {
        'featured' => _('Featured వారం', 'Featured week'),
        'listing' => _('అదనపు listing', 'Extra listing'),
        _ => _('ప్లాన్', 'Plan'),
      };
  String get share => _('WhatsApp లో షేర్', 'Share on WhatsApp');
  String shareText(String title, String price, String code) =>
      _('$title — $price ($code), OnlineLand లో చూడండి:', '$title — $price ($code), see it on OnlineLand:');
  String stats(int v, int sh, int l) => _('👁 $v · షేర్లు $sh · enquiries $l', '👁 $v · shares $sh · enquiries $l');
  String get feature => _('పైన చూపించు (Featured)', 'Feature on top');
  String featureFree(int left) => _('Featured slot వాడండి ($left మిగిలాయి)', 'Use a featured slot ($left left)');
  String get featuredDone => _('ఈ ప్రాపర్టీ 7 రోజులు పైన కనిపిస్తుంది.', 'This property will show on top for 7 days.');
  String get payListing => _('Live చేయడానికి చెల్లించండి', 'Pay to go live');
  String payListingNote(int free) => _('ఓనర్‌కు $free listing ఉచితం. తర్వాతి వాటికి చిన్న ఫీజు.', 'Owners get $free listing free; a small fee after that.');
  String get leadsNeedPlan => _('మీ షేర్ లింక్ ద్వారా వచ్చిన leads చూడటానికి Basic లేదా Pro ప్లాన్ కావాలి.', 'You need the Basic or Pro plan to see leads from your shared links.');
  String get leadsEmpty => _('ఇంకా leads రాలేదు. మీ ప్రాపర్టీలను WhatsApp లో షేర్ చేయండి.', 'No leads yet. Share your properties on WhatsApp.');
  String get seePlans => _('ప్లాన్‌లు చూడండి', 'See plans');

  // account & legal (Phase 8)
  String get deleteAccount => _('ఖాతా తొలగించండి', 'Delete account');
  String get deleteAccountTitle => _('ఖాతా తొలగించాలా?', 'Delete your account?');
  String get deleteAccountBody => _(
      'మీ ప్రొఫైల్, favourites తొలగిపోతాయి; మీ ప్రాపర్టీలు సైట్ నుంచి తీసేస్తాం. చెల్లింపు రికార్డులు చట్టం కోసం ఉంచుతాం. ఇది తిరిగి రాదు.',
      'Your profile and favourites are deleted and your properties are taken off the site. Payment records are kept for legal reasons. This cannot be undone.');
  String get deleteConfirm => _('అవును, తొలగించండి', 'Yes, delete');
  String get accountDeleted => _('మీ ఖాతా తొలగించబడింది.', 'Your account has been deleted.');
  String get privacyPolicy => _('గోప్యతా విధానం', 'Privacy policy');
  String get termsOfUse => _('నిబంధనలు', 'Terms of use');

  // near me
  String get nearMe => _('నా దగ్గర', 'Near me');
  String get locating => _('లొకేషన్ చూస్తున్నాం…', 'Finding your location…');
  String get nearActive => _('మీ దగ్గర ఉన్నవి ముందు', 'Nearest to you first');
  String get radiusAny => _('ఎంత దూరమైనా', 'Any distance');
  String radiusKm(int km) => _('$km కి.మీ లోపు', 'Within $km km');
  String get nearOff => _('తీసేయండి', 'Turn off');
  String get sortNearest => _('దగ్గర ఉన్నవి ముందు', 'Nearest first');
  String get km => _('కి.మీ', 'km');
  String get locationDenied => _('లొకేషన్ అనుమతి లేదు. జిల్లా/మండలం ఎంచుకోండి.', 'Location not allowed. Choose a district/mandal instead.');
  String get locationOutside => _('మీరు తెలంగాణ బయట ఉన్నారు. జిల్లా/మండలం ఎంచుకోండి.', 'You seem to be outside Telangana. Choose a district/mandal.');

  // listing videos
  String get video => _('వీడియో', 'Video');
  String get videoOptional => _('వీడియో (ఐచ్ఛికం)', 'Video (optional)');
  String get videoHint => _('2 నిమిషాల లోపు ఒక వీడియో. Upload కి ముందు ఫోన్‌లోనే చిన్నదిగా (720p) మారుస్తాం.', 'One video up to 2 minutes. It is made smaller (720p) on your phone before upload.');
  String get recordVideo => _('రికార్డ్ చేయండి', 'Record');
  String get pickVideo => _('గ్యాలరీ నుంచి', 'From gallery');
  String get youtubeLink => _('లేదా YouTube లింక్', 'Or a YouTube link');
  String get youtubeInvalid => _('సరైన YouTube లింక్ ఇవ్వండి.', 'Enter a valid YouTube link.');
  String videoTooLong(int sec) => _('వీడియో ${sec ~/ 60}:${(sec % 60).toString().padLeft(2, '0')} ఉంది. 2 నిమిషాల లోపు ఉండాలి.', 'The video is ${sec ~/ 60}:${(sec % 60).toString().padLeft(2, '0')}. It must be under 2 minutes.');
  String compressing(int pct) => _('వీడియో చిన్నదిగా మారుస్తున్నాం… $pct%', 'Making the video smaller… $pct%');
  String videoReady(String dur, String mb) => _('వీడియో సిద్ధం: $dur · $mb MB', 'Video ready: $dur · $mb MB');
  String get uploadingVideo => _('వీడియో upload అవుతోంది…', 'Uploading the video…');
  String get videoFailed => _('వీడియో సిద్ధం కాలేదు. మళ్లీ ప్రయత్నించండి లేదా YouTube లింక్ ఇవ్వండి.', 'Could not prepare the video. Try again or give a YouTube link.');
  String get removeVideo => _('వీడియో తీసేయండి', 'Remove video');
  String get playVideo => _('వీడియో ప్లే చేయండి', 'Play video');
  String get openYouTube => _('YouTube లో చూడండి', 'Watch on YouTube');
}
