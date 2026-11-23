/**
 * Privacy policy, terms, refund policy and account deletion — Telugu and English.
 * Written to match what the website, app and Cloud Functions actually do (Phases 3–7).
 * Have a lawyer / CA review before launch; update `updated` whenever the text changes.
 */
import type { Locale } from '@onlineland/shared';

export const LEGAL_DOCS = ['privacy', 'terms', 'refund', 'delete-account'] as const;
export type LegalDoc = (typeof LEGAL_DOCS)[number];

export interface LegalSection {
  heading: string;
  body: string[]; // paragraphs; lines starting with "• " render as a list
}

export interface LegalPage {
  title: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_UPDATED = '2026-11-24';
const COMPANY = 'OnlineLand Infra Private Limited';

const te: Record<LegalDoc, LegalPage> = {
  privacy: {
    title: 'గోప్యతా విధానం (Privacy Policy)',
    intro: `onlineland.in వెబ్‌సైట్ మరియు OnlineLand Android యాప్‌ను ${COMPANY} ("OnlineLand", "మేము") నడుపుతుంది. మీ వివరాలు ఏవి తీసుకుంటాం, ఎందుకు, ఎవరికి చూపిస్తాం అనేది ఇక్కడ ఉంది.`,
    sections: [
      {
        heading: 'మేము తీసుకునే వివరాలు',
        body: [
          '• మొబైల్ నంబర్: OTP తో లాగిన్ అవ్వడానికి (Firebase Authentication ద్వారా).',
          '• పేరు, మొబైల్ నంబర్, సందేశం: మీరు enquiry, సైట్ విజిట్ లేదా సేవ (డ్రోన్ వీడియో, documents చెక్, సర్వే, registration, లోన్) request పంపినప్పుడు.',
          '• మీరు పెట్టే ప్రాపర్టీ వివరాలు: ఫోటోలు, వీడియో (ఉంటే; ఫోన్‌లోనే చిన్నగా compress చేసి upload చేస్తాం) లేదా YouTube లింక్, ధర, విస్తీర్ణం, లొకేషన్, మరియు ఓనర్ పేరు/నంబర్. ఓనర్ నంబర్ ప్రైవేట్‌గా ఉంటుంది, సైట్‌లో ఎవరికీ కనిపించదు.',
          '• లొకేషన్: (1) ప్రాపర్టీ పోస్ట్ చేసేటప్పుడు "నా లొకేషన్" నొక్కితే, ఆ ప్రాపర్టీ స్థానం సేవ్ అవుతుంది. (2) "నా దగ్గర" నొక్కితే దగ్గర ఉన్న ప్రాపర్టీలు చూపించడానికి మాత్రమే వాడతాం. యాప్‌లో ఇది మీ ఫోన్‌లోనే లెక్కించబడుతుంది; వెబ్‌సైట్‌లో సుమారు 1 కి.మీ వరకు రౌండ్ చేసి పేజీ చిరునామాలో పెడతాం. దీన్ని మేము సేవ్ చేయము, మీ కదలికలను ట్రాక్ చేయము.',
          '• చెల్లింపు వివరాలు: మొత్తం మరియు UPI UTR నంబర్ మాత్రమే. మీ బ్యాంక్ ఖాతా, కార్డ్, UPI PIN మేము ఎప్పుడూ తీసుకోము.',
          '• Notifications కోసం ఫోన్ token, సేవ్ చేసిన ప్రాపర్టీలు (favourites).',
          '• ప్రతి ప్రాపర్టీకి views, shares సంఖ్యలు (మొత్తం లెక్కలు మాత్రమే, ఎవరు చూశారో కాదు).',
        ],
      },
      {
        heading: 'ఎందుకు ఉపయోగిస్తాం',
        body: [
          'మీరు అడిగిన ప్రాపర్టీ గురించి మిమ్మల్ని సంప్రదించడానికి, సైట్ విజిట్ ఏర్పాటు చేయడానికి, మీ listing ను చెక్ చేసి ప్రచురించడానికి, మీ ప్లాన్/చెల్లింపును ఆమోదించడానికి, మరియు మోసాలను ఆపడానికి.',
        ],
      },
      {
        heading: 'ఎవరికి చూపిస్తాం',
        body: [
          '• OnlineLand team మరియు మా sales agents: మీ enquiry ని follow-up చేయడానికి.',
          '• Dealer: మీరు ఒక dealer పంపిన లింక్ ద్వారా enquiry పెడితే, ఆ dealer కి మీ పేరు, నంబర్, సందేశం కనిపిస్తాయి. ఫారమ్ మీదే ఈ విషయం చూపిస్తాం.',
          '• సేవలు అందించే సంస్థలు: Google Firebase (డేటా భారత్‌లో, asia-south1 రీజియన్‌లో నిల్వ), Vercel (వెబ్‌సైట్ హోస్టింగ్), Google Analytics (సైట్ వాడకం లెక్కలు).',
          '• చట్టం ప్రకారం అధికారులు అడిగినప్పుడు.',
          'మీ వివరాలను మేము ఎవరికీ అమ్మము.',
        ],
      },
      {
        heading: 'ఎంత కాలం ఉంచుతాం',
        body: [
          'మీ ఖాతా ఉన్నంత వరకు. ఖాతా తొలగిస్తే మీ ప్రొఫైల్, favourites, notification tokens తొలగిస్తాం; మీ ప్రాపర్టీలు సైట్ నుంచి తీసేస్తాం. చట్టపరమైన లెక్కల కోసం చెల్లింపు రికార్డులు మరియు ఆడిట్ లాగ్‌లు 8 సంవత్సరాలు ఉంచుతాం.',
        ],
      },
      {
        heading: 'మీ హక్కులు',
        body: [
          'మీ వివరాలు చూడడం, సరిచేయడం, తొలగించమని అడగడం మీ హక్కు (Digital Personal Data Protection Act, 2023). యాప్‌లో Profile → "ఖాతా తొలగించండి", లేదా WhatsApp/కాల్ +91 99597 31120.',
        ],
      },
      {
        heading: 'భద్రత',
        body: ['లాగిన్ OTP తో మాత్రమే. డేటా ఎన్‌క్రిప్ట్ చేసి నిల్వ చేస్తాం. ఎవరు ఏమి చూడవచ్చో Firebase భద్రతా నియమాలు నిర్ణయిస్తాయి; admin చేసే ప్రతి మార్పు రికార్డ్ అవుతుంది.'],
      },
      {
        heading: 'పిల్లలు',
        body: ['OnlineLand 18 ఏళ్లు పైబడిన వారి కోసం. పిల్లల వివరాలు తెలిసి తీసుకోము.'],
      },
      {
        heading: 'సంప్రదించండి (Grievance Officer)',
        body: [`${COMPANY}, మక్తల్, నారాయణపేట జిల్లా, తెలంగాణ. ఫోన్/WhatsApp: +91 99597 31120, ఇమెయిల్: info@onlineland.in. 30 రోజుల్లో సమాధానం ఇస్తాం.`],
      },
    ],
  },
  terms: {
    title: 'నిబంధనలు (Terms of Use)',
    intro: `onlineland.in మరియు OnlineLand యాప్ వాడితే ఈ నిబంధనలకు మీరు అంగీకరించినట్లే. ఈ సేవలను ${COMPANY} అందిస్తుంది.`,
    sections: [
      {
        heading: 'OnlineLand ఏమి చేస్తుంది',
        body: [
          'OnlineLand రియల్ ఎస్టేట్ కన్సల్టెన్సీ మరియు ప్రాపర్టీ మార్కెట్‌ప్లేస్. కొనేవారిని, అమ్మేవారిని కలుపుతాం; enquiries మా team ద్వారా జరుగుతాయి. Deal మా ద్వారా జరిగితే, ముందే చెప్పిన కమీషన్ వర్తిస్తుంది.',
        ],
      },
      {
        heading: 'Listings',
        body: [
          '• మీరు పెట్టే ప్రాపర్టీ మీదే అయి ఉండాలి, లేదా అమ్మడానికి మీకు అనుమతి ఉండాలి. వివరాలు, ఫోటోలు, వీడియోలు నిజమైనవి అయి ఉండాలి.',
          '• ప్రతి listing admin చెక్ చేశాకే ప్రచురిస్తాం. తప్పుడు లేదా అనుమానాస్పద listings ను కారణం చెప్పి తిరస్కరిస్తాం లేదా తీసేస్తాం.',
          '• "పత్రాలు పరిశీలించాం" అంటే మేము చూసిన కాపీలు సరిపోయాయి అని మాత్రమే. కొనే ముందు మీ సొంత లాయర్‌తో టైటిల్, EC, సర్వే వివరాలు తప్పక చెక్ చేయించుకోండి.',
        ],
      },
      {
        heading: 'ప్లాన్‌లు మరియు చెల్లింపులు',
        body: [
          '• Basic మరియు Pro ప్లాన్‌లు నెలకు (30 రోజులు) లేదా సంవత్సరానికి (365 రోజులు). Featured listing 7 రోజులకు. ఓనర్‌కు 1 listing ఉచితం; తర్వాతి ప్రతి listing కి ఫీజు, అది అమ్ముడయ్యే వరకు లేదా 90 రోజుల వరకు ఉంటుంది. ప్రస్తుత ధరలు యాప్‌లో "నా ప్లాన్" లో ఉంటాయి.',
          '• చెల్లింపు UPI ద్వారా. మీరు UTR నంబర్ ఇచ్చాక, మా ఖాతాలో డబ్బు వచ్చిందని చెక్ చేసి ఆమోదిస్తాం.',
          '• ప్లాన్ ఆటోమేటిక్‌గా renew కాదు. గడువుకు ముందు మేము గుర్తు చేస్తాం.',
          '• Launch offer: OnlineLand ప్రకటించిన జిల్లాల్లో కొత్త dealers ఒక్కసారి ఉచిత ప్లాన్ తీసుకోవచ్చు. ఆఫర్ ఎప్పుడైనా ఆపవచ్చు.',
        ],
      },
      {
        heading: 'OnlineLand ద్వారా అమ్మకం',
        body: [
          'ఓనర్ "OnlineLand అమ్మిపెట్టాలి" ఎంచుకుంటే, మేము కొనేవాళ్ళను తెచ్చి, బేరం, documents, registration వరకు సహాయం చేస్తాం. ఆ ఆస్తి మా ద్వారా అమ్ముడైతేనే ఫీజు (ఎంపిక చేసే సమయంలో యాప్‌లో చూపించిన శాతం). అమ్ముడుపోకపోతే ఏమీ కట్టనవసరం లేదు. ఓనర్ ఈ ఎంపికను ఎప్పుడైనా మార్చుకోవచ్చు; ఎంపిక చేసిన తేదీ, సమయం మా దగ్గర రికార్డ్ అవుతాయి.',
        ],
      },
      {
        heading: 'సేవలు',
        body: [
          'డ్రోన్ వీడియో, documents చెక్, సర్వే, registration, లోన్ సహాయం. స్థిర ధర ఉన్న సేవలకు ఆ ధర, మిగతా వాటికి మేము చూసి చెప్పిన ధర చెల్లించాలి. చెల్లింపు UPI ద్వారా, మేము ఆమోదించాక పని మొదలవుతుంది. Documents చెక్ ఒక న్యాయవాది అభిప్రాయం మాత్రమే; తుది నిర్ణయం కొనేవారిదే.',
        ],
      },
      {
        heading: 'Dealers',
        body: [
          'Dealer తన సొంత listing ల లింక్ షేర్ చేయవచ్చు. Paid ప్లాన్‌లో ఆ లింక్ ద్వారా వచ్చిన enquiries dealer కి కనిపిస్తాయి. OnlineLand సైట్/యాప్ సెర్చ్, ప్రకటనల ద్వారా వచ్చిన enquiries OnlineLand కే చెందుతాయి. కస్టమర్ వివరాలను enquiry కోసం మాత్రమే వాడాలి; spam చేస్తే ఖాతా నిలిపివేస్తాం.',
        ],
      },
      {
        heading: 'చేయకూడనివి',
        body: ['నకిలీ listings, ఇతరుల ఫోటోలు, మోసపూరిత ధరలు, spam enquiries, సైట్‌ను దెబ్బతీసే ప్రయత్నాలు. ఇలా చేస్తే ఖాతా నిలిపివేసి, అవసరమైతే చట్టపరమైన చర్య తీసుకుంటాం.'],
      },
      {
        heading: 'బాధ్యత',
        body: [
          'కొనుగోలుదారు, అమ్మకందారు మధ్య జరిగే ఒప్పందం వారిద్దరిదే. listing లోని వివరాలకు, ప్రాపర్టీ టైటిల్‌కు OnlineLand హామీ ఇవ్వదు. చట్టం అనుమతించిన మేరకు, మా బాధ్యత మీరు మాకు చెల్లించిన ఫీజుకు మించదు.',
        ],
      },
      {
        heading: 'చట్టం',
        body: ['ఈ నిబంధనలకు భారత చట్టాలు వర్తిస్తాయి. వివాదాలు తెలంగాణ కోర్టుల పరిధిలోకి వస్తాయి. నిబంధనలు మారితే ఈ పేజీలో తేదీ మారుస్తాం.'],
      },
    ],
  },
  refund: {
    title: 'చెల్లింపులు & రిఫండ్ విధానం',
    intro: 'ప్లాన్‌లు, featured listings, అదనపు listings కోసం చెల్లింపులు UPI ద్వారా జరుగుతాయి.',
    sections: [
      {
        heading: 'ఆమోదం',
        body: ['మీరు UTR నంబర్ పంపిన తర్వాత, సాధారణంగా 24 గంటల్లో (పని దినాల్లో) మేము చెక్ చేసి ఆమోదిస్తాం. ఆమోదించగానే notification వస్తుంది.'],
      },
      {
        heading: 'రిఫండ్ ఎప్పుడు ఇస్తాం',
        body: [
          '• డబ్బు మాకు వచ్చి, మేము 7 రోజుల్లో ప్లాన్/listing ను on చేయలేకపోతే: పూర్తి రిఫండ్.',
          '• పొరపాటున రెండుసార్లు చెల్లిస్తే: అదనపు మొత్తం రిఫండ్.',
          '• మేము మీ listing ను తిరస్కరిస్తే, దానికి కట్టిన listing/featured ఫీజు: పూర్తి రిఫండ్.',
          '• ప్లాన్ మొదలైన తర్వాత మధ్యలో ఆపితే: ఉపయోగించని రోజులకు రిఫండ్ ఉండదు.',
        ],
      },
      {
        heading: 'ఎలా అడగాలి',
        body: ['WhatsApp +91 99597 31120 కు లేదా info@onlineland.in కు మీ UTR నంబర్‌తో మెసేజ్ చేయండి. రిఫండ్ 7 పని దినాల్లో అదే UPI ఖాతాకు పంపుతాం.'],
      },
    ],
  },
  'delete-account': {
    title: 'ఖాతా తొలగించడం',
    intro: 'మీ OnlineLand ఖాతాను, దాని వివరాలను ఎప్పుడైనా తొలగించుకోవచ్చు.',
    sections: [
      {
        heading: 'యాప్‌లో',
        body: ['Profile → "ఖాతా తొలగించండి" → నిర్ధారించండి. వెంటనే తొలగిపోతుంది.'],
      },
      {
        heading: 'యాప్ లేకపోతే',
        body: ['మీ ఖాతా ఉన్న మొబైల్ నంబర్ నుంచి WhatsApp +91 99597 31120 కు (లేదా info@onlineland.in కు) "నా ఖాతా తొలగించండి" అని పంపండి. 7 రోజుల్లో తొలగిస్తాం.'],
      },
      {
        heading: 'ఏమి తొలగిపోతుంది',
        body: [
          '• లాగిన్, ప్రొఫైల్, favourites, notification tokens: పూర్తిగా.',
          '• మీ ప్రాపర్టీలు: సైట్ నుంచి తీసేస్తాం, ఓనర్ నంబర్ తొలగిస్తాం.',
          '• ఉంచేవి: చెల్లింపు రికార్డులు మరియు ఆడిట్ లాగ్‌లు (చట్టపరమైన లెక్కల కోసం, 8 సంవత్సరాలు). మీరు పంపిన enquiries మా CRM లో ఉంటాయి; అవి కూడా తొలగించాలంటే WhatsApp లో చెప్పండి.',
        ],
      },
    ],
  },
};

const en: Record<LegalDoc, LegalPage> = {
  privacy: {
    title: 'Privacy Policy',
    intro: `The onlineland.in website and the OnlineLand Android app are run by ${COMPANY} ("OnlineLand", "we"). This explains what we collect, why, and who sees it.`,
    sections: [
      {
        heading: 'What we collect',
        body: [
          '• Mobile number: to sign in with OTP (via Firebase Authentication).',
          '• Name, mobile number and message: when you send an enquiry, book a site visit or ask for a service (drone video, document check, survey, registration, loan).',
          "• Properties you post: photos, an optional video (compressed on your phone before upload) or YouTube link, price, area, location and the owner's name/number. The owner's number is private and never shown on the site.",
          '• Location: (1) when you tap "use my location" while posting a property, it is saved as that property\'s map position; (2) when you tap "Near me", it is used only to show nearby properties — in the app this is worked out on your phone, on the website it is rounded to about 1 km and put in the page address. We do not save it or track where you go.',
          '• Payments: the amount and your UPI UTR number only. We never collect bank account, card or UPI PIN details.',
          '• A device token for notifications, and properties you save (favourites).',
          '• View and share counts per property (totals only, not who viewed).',
        ],
      },
      {
        heading: 'Why we use it',
        body: [
          'To contact you about the property you asked about, arrange site visits, review and publish your listings, confirm your plan or payment, and prevent fraud.',
        ],
      },
      {
        heading: 'Who sees it',
        body: [
          '• The OnlineLand team and our sales agents, to follow up your enquiry.',
          "• A dealer: if you enquire through a link a dealer sent you, that dealer sees your name, number and message. The form tells you this.",
          '• Service providers: Google Firebase (data stored in India, asia-south1 region), Vercel (website hosting), Google Analytics (site usage statistics).',
          '• Authorities, when the law requires it.',
          'We do not sell your data.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: [
          'For as long as your account exists. When you delete your account we delete your profile, favourites and notification tokens and take your properties off the site. Payment records and audit logs are kept for 8 years for legal accounting.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'You can see, correct or ask us to delete your data (Digital Personal Data Protection Act, 2023): in the app, Profile → "Delete account", or WhatsApp/call +91 99597 31120.',
        ],
      },
      {
        heading: 'Security',
        body: ['Sign-in is by OTP only. Data is stored encrypted. Firebase security rules decide who can see what, and every admin change is logged.'],
      },
      {
        heading: 'Children',
        body: ['OnlineLand is for people aged 18 and over. We do not knowingly collect data from children.'],
      },
      {
        heading: 'Contact (Grievance Officer)',
        body: [`${COMPANY}, Makthal, Narayanpet District, Telangana. Phone/WhatsApp: +91 99597 31120, email: info@onlineland.in. We reply within 30 days.`],
      },
    ],
  },
  terms: {
    title: 'Terms of Use',
    intro: `By using onlineland.in or the OnlineLand app you agree to these terms. The services are provided by ${COMPANY}.`,
    sections: [
      {
        heading: 'What OnlineLand does',
        body: [
          'OnlineLand is a real estate consultancy and property marketplace. We connect buyers and sellers; enquiries go through our team. If a deal is done through us, the commission agreed in advance applies.',
        ],
      },
      {
        heading: 'Listings',
        body: [
          '• You may only post property you own or are authorised to sell. Details, photos and videos must be true.',
          '• Every listing is reviewed by our admin before it is published. We reject or remove false or suspicious listings, with a reason.',
          '• "Documents checked" means only that the copies we saw matched. Before buying, have your own lawyer verify title, EC and survey details.',
        ],
      },
      {
        heading: 'Plans and payments',
        body: [
          '• Basic and Pro plans run monthly (30 days) or yearly (365 days); a featured listing for 7 days. Owners get 1 listing free; each further listing is paid and stays live until sold or for 90 days. Current prices are shown in the app under "My plan".',
          '• Payment is by UPI. After you send the UTR number we check that the money reached our account, then approve.',
          '• Plans do not renew automatically. We remind you before they end.',
          '• Launch offer: in districts OnlineLand announces, a new dealer may take one free plan once. The offer may end at any time.',
        ],
      },
      {
        heading: 'Selling through OnlineLand',
        body: [
          'If an owner chooses "OnlineLand should sell it", we bring buyers and help with negotiation, documents and registration. A fee (the percentage shown in the app when choosing) is due only if the property sells through us. Nothing is due if it does not sell. The owner can change this choice at any time; the date and time of the choice are recorded.',
        ],
      },
      {
        heading: 'Services',
        body: [
          'Drone video, document check, survey, registration and loan help. Fixed-price services cost the listed price; others cost the price we quote after a look. Payment is by UPI and work starts after we confirm it. A document check is a lawyer\'s opinion; the buyer makes the final decision.',
        ],
      },
      {
        heading: 'Dealers',
        body: [
          "Dealers may share links to their own listings. On a paid plan, enquiries from those links are shown to the dealer. Enquiries from OnlineLand's site/app search and advertising belong to OnlineLand. Use customer details only for that enquiry; accounts that spam are suspended.",
        ],
      },
      {
        heading: 'Not allowed',
        body: ["Fake listings, other people's photos, misleading prices, spam enquiries, or attempts to harm the service. We suspend such accounts and may take legal action."],
      },
      {
        heading: 'Liability',
        body: [
          'Any agreement between a buyer and a seller is between them. OnlineLand does not guarantee listing details or property title. To the extent the law allows, our liability is limited to the fees you paid us.',
        ],
      },
      {
        heading: 'Law',
        body: ['These terms are governed by the laws of India; disputes fall under the courts of Telangana. If the terms change we update the date on this page.'],
      },
    ],
  },
  refund: {
    title: 'Payments & Refund Policy',
    intro: 'Plans, featured listings and extra listings are paid by UPI.',
    sections: [
      {
        heading: 'Confirmation',
        body: ['After you send the UTR number we check and approve it, usually within 24 hours on working days. You get a notification when it is approved.'],
      },
      {
        heading: 'When we refund',
        body: [
          '• We received the money but could not switch on your plan/listing within 7 days: full refund.',
          '• You paid twice by mistake: the extra amount.',
          '• We reject your listing: the listing/featured fee paid for it, in full.',
          '• Stopping a plan part-way: no refund for unused days.',
        ],
      },
      {
        heading: 'How to ask',
        body: ['WhatsApp +91 99597 31120 or email info@onlineland.in with your UTR number. Refunds are sent to the same UPI account within 7 working days.'],
      },
    ],
  },
  'delete-account': {
    title: 'Delete your account',
    intro: 'You can delete your OnlineLand account and its data at any time.',
    sections: [
      { heading: 'In the app', body: ['Profile → "Delete account" → confirm. It is deleted immediately.'] },
      {
        heading: 'Without the app',
        body: ['From the mobile number of your account, WhatsApp (or email info@onlineland.in) "Delete my account" to +91 99597 31120. We delete it within 7 days.'],
      },
      {
        heading: 'What is deleted',
        body: [
          '• Sign-in, profile, favourites, notification tokens: completely.',
          "• Your properties: taken off the site and the owner's number deleted.",
          '• Kept: payment records and audit logs (legal accounting, 8 years). Enquiries you sent stay in our CRM; tell us on WhatsApp if you want those deleted too.',
        ],
      },
    ],
  },
};

export const LEGAL: Record<Locale, Record<LegalDoc, LegalPage>> = { te, en };
