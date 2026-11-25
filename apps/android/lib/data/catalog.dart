/// Mirrors packages/shared (categories, districts, mandals, units).
/// test/catalog_test.dart checks these lists against the shared TypeScript source.
class Named {
  final String id;
  final String te;
  final String en;
  const Named(this.id, this.en, this.te);
  String label(bool telugu) => telugu ? te : en;
}

const categories = <Named>[
  Named('agricultural', 'Agricultural Lands', 'వ్యవసాయ భూములు'),
  Named('open-plot', 'Open Plots', 'ఓపెన్ ప్లాట్లు'),
  Named('flat', 'Flats', 'ఫ్లాట్లు'),
  Named('apartment', 'Apartments', 'అపార్ట్‌మెంట్లు'),
  Named('villa', 'Villas', 'విల్లాలు'),
  Named('luxury-home', 'Luxury Homes', 'లగ్జరీ ఇళ్లు'),
  Named('commercial', 'Commercial Properties', 'వాణిజ్య ఆస్తులు'),
  Named('farmhouse', 'Farmhouses', 'ఫామ్‌హౌస్‌లు'),
  Named('rental', 'Rental Properties', 'అద్దె ఆస్తులు'),
];

const areaUnits = <Named>[
  Named('acre', 'Acres', 'ఎకరాలు'),
  Named('gunta', 'Guntas', 'గుంటలు'),
  Named('sq-yd', 'Sq. yards', 'చ. గజాలు'),
  Named('sq-ft', 'Sq. ft', 'చ. అడుగులు'),
];

const perUnit = <String, Named>{
  'acre': Named('acre', 'per acre', 'ఎకరానికి'),
  'gunta': Named('gunta', 'per gunta', 'గుంటకు'),
  'sq-yd': Named('sq-yd', 'per sq. yd', 'గజానికి'),
  'sq-ft': Named('sq-ft', 'per sq. ft', 'చ. అడుగుకు'),
};

const districts = <Named>[
  Named('adilabad', 'Adilabad', 'ఆదిలాబాద్'),
  Named('bhadradri-kothagudem', 'Bhadradri Kothagudem', 'భద్రాద్రి కొత్తగూడెం'),
  Named('hanumakonda', 'Hanumakonda', 'హనుమకొండ'),
  Named('hyderabad', 'Hyderabad', 'హైదరాబాద్'),
  Named('jagtial', 'Jagtial', 'జగిత్యాల'),
  Named('jangaon', 'Jangaon', 'జనగామ'),
  Named('jayashankar-bhupalpally', 'Jayashankar Bhupalpally', 'జయశంకర్ భూపాలపల్లి'),
  Named('jogulamba-gadwal', 'Jogulamba Gadwal', 'జోగులాంబ గద్వాల'),
  Named('kamareddy', 'Kamareddy', 'కామారెడ్డి'),
  Named('karimnagar', 'Karimnagar', 'కరీంనగర్'),
  Named('khammam', 'Khammam', 'ఖమ్మం'),
  Named('kumuram-bheem-asifabad', 'Kumuram Bheem Asifabad', 'కుమురం భీం ఆసిఫాబాద్'),
  Named('mahabubabad', 'Mahabubabad', 'మహబూబాబాద్'),
  Named('mahabubnagar', 'Mahabubnagar', 'మహబూబ్‌నగర్'),
  Named('mancherial', 'Mancherial', 'మంచిర్యాల'),
  Named('medak', 'Medak', 'మెదక్'),
  Named('medchal-malkajgiri', 'Medchal-Malkajgiri', 'మేడ్చల్-మల్కాజిగిరి'),
  Named('mulugu', 'Mulugu', 'ములుగు'),
  Named('nagarkurnool', 'Nagarkurnool', 'నాగర్‌కర్నూల్'),
  Named('nalgonda', 'Nalgonda', 'నల్గొండ'),
  Named('narayanpet', 'Narayanpet', 'నారాయణపేట'),
  Named('nirmal', 'Nirmal', 'నిర్మల్'),
  Named('nizamabad', 'Nizamabad', 'నిజామాబాద్'),
  Named('peddapalli', 'Peddapalli', 'పెద్దపల్లి'),
  Named('rajanna-sircilla', 'Rajanna Sircilla', 'రాజన్న సిరిసిల్ల'),
  Named('rangareddy', 'Rangareddy', 'రంగారెడ్డి'),
  Named('sangareddy', 'Sangareddy', 'సంగారెడ్డి'),
  Named('siddipet', 'Siddipet', 'సిద్దిపేట'),
  Named('suryapet', 'Suryapet', 'సూర్యాపేట'),
  Named('vikarabad', 'Vikarabad', 'వికారాబాద్'),
  Named('wanaparthy', 'Wanaparthy', 'వనపర్తి'),
  Named('warangal', 'Warangal', 'వరంగల్'),
  Named('yadadri-bhuvanagiri', 'Yadadri Bhuvanagiri', 'యాదాద్రి భువనగిరి'),
];

const mandals = <String, List<Named>>{
  'narayanpet': [
    Named('damaragidda', 'Damaragidda', 'దామరగిద్ద'),
    Named('dhanwada', 'Dhanwada', 'ధన్వాడ'),
    Named('gundumal', 'Gundumal', 'గుండుమల్'),
    Named('kosgi', 'Kosgi', 'కోస్గి'),
    Named('kothapally', 'Kothapally', 'కొత్తపల్లి'),
    Named('krishna', 'Krishna', 'కృష్ణ'),
    Named('maddur', 'Maddur', 'మద్దూర్'),
    Named('maganoor', 'Maganoor', 'మాగనూర్'),
    Named('makthal', 'Makthal', 'మక్తల్'),
    Named('marikal', 'Marikal', 'మరికల్'),
    Named('narayanpet', 'Narayanpet', 'నారాయణపేట'),
    Named('narva', 'Narva', 'నర్వ'),
    Named('utkoor', 'Utkoor', 'ఊట్కూర్'),
  ],
};

Named? byId(List<Named> list, String? id) {
  for (final n in list) {
    if (n.id == id) return n;
  }
  return null;
}

/// Budget ranges in rupees (same keys as the website URLs).
const saleBudgets = <(String, String, String)>[
  ('0-1000000', 'Under ₹10 lakh', '₹10 లక్షల లోపు'),
  ('1000000-2500000', '₹10 – 25 lakh', '₹10 – 25 లక్షలు'),
  ('2500000-5000000', '₹25 – 50 lakh', '₹25 – 50 లక్షలు'),
  ('5000000-10000000', '₹50 lakh – 1 crore', '₹50 లక్షలు – 1 కోటి'),
  ('10000000-', 'Above ₹1 crore', '₹1 కోటి పైన'),
];
const rentBudgets = <(String, String, String)>[
  ('0-10000', 'Under ₹10,000', '₹10,000 లోపు'),
  ('10000-25000', '₹10,000 – 25,000', '₹10,000 – 25,000'),
  ('25000-50000', '₹25,000 – 50,000', '₹25,000 – 50,000'),
  ('50000-', 'Above ₹50,000', '₹50,000 పైన'),
];
