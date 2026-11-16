import 'dart:async';
import 'dart:typed_data';

import 'models.dart';
import 'repository.dart';

/// Sample data for the demo APK and widget tests. Same listings as scripts/seed-emulator.mjs.
/// Nothing is sent anywhere; leads and new listings live only until the app closes.
class DemoRepository implements Repository {
  DemoRepository({DateTime? now}) : _now = now ?? DateTime.now() {
    _items.addAll(_seed(_now));
  }

  static const demoOtp = '123456';
  final DateTime _now;
  final List<Property> _items = [];
  final leads = <Map<String, Object?>>[];
  final visits = <Map<String, Object?>>[];
  final _auth = StreamController<AppUser?>.broadcast();
  AppUser? _user;
  int _seq = 0;

  @override
  bool get isDemo => true;

  @override
  Future<List<Property>> approvedProperties() async => _items.where((p) => p.status == 'approved').toList()
    ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

  @override
  Future<Property?> propertyByCode(String code) async {
    for (final p in _items) {
      if (p.code == code && p.status == 'approved') return p;
    }
    return null;
  }

  @override
  String photoUrl(String path) => '';

  @override
  Future<void> createLead({required String? propertyId, required String channel, required String locale, String? name, String? phone, String? message}) async {
    leads.add({'propertyId': propertyId, 'channel': channel, 'locale': locale, 'name': name, 'phone': phone, 'message': message});
  }

  @override
  Future<void> createSiteVisit({required String propertyId, required String name, required String phone, required String date, required String slot, required String locale}) async {
    await createLead(propertyId: propertyId, channel: 'site-visit', locale: locale, name: name, phone: phone, message: '$date $slot');
    visits.add({'propertyId': propertyId, 'name': name, 'phone': phone, 'date': date, 'slot': slot});
  }

  @override
  Stream<AppUser?> authChanges() async* {
    yield _user;
    yield* _auth.stream;
  }

  @override
  AppUser? get currentUser => _user;

  @override
  Future<String> sendOtp(String phone10) async => 'demo:$phone10';

  @override
  Future<AppUser> verifyOtp(String verificationId, String code) async {
    if (code != demoOtp) throw RepoException('invalid-code', 'Wrong OTP');
    _user = AppUser(uid: 'demo-user', phone: '+91${verificationId.split(':').last}', role: 'buyer');
    _auth.add(_user);
    return _user!;
  }

  @override
  Future<void> signOut() async {
    _user = null;
    _auth.add(null);
  }

  @override
  Future<String> becomeOwner() async {
    final u = _user;
    if (u == null) throw RepoException('unauthenticated', 'Sign in first');
    if (u.canPost) return u.role;
    _user = AppUser(uid: u.uid, phone: u.phone, role: 'owner');
    _auth.add(_user);
    return 'owner';
  }

  @override
  Future<String> submitListing(ListingDraft d, List<Uint8List> photos, {void Function(int done, int total)? onProgress}) async {
    final u = _user;
    if (u == null || !u.canPost) throw RepoException('permission-denied', 'Owners only');
    for (var i = 0; i < photos.length; i++) {
      onProgress?.call(i + 1, photos.length);
    }
    final id = 'demo-new-${++_seq}';
    _items.add(Property(
      id: id,
      code: null,
      category: d.category,
      purpose: d.purpose,
      titleTe: d.title,
      titleEn: '',
      descriptionTe: d.description,
      price: d.price ?? 0,
      priceBasis: d.priceBasis,
      area: d.area ?? 0,
      areaUnit: d.areaUnit,
      place: Place(district: d.district, mandal: d.mandal, village: d.village, lat: d.lat, lng: d.lng),
      status: 'pending',
      ownerId: u.uid,
      createdAt: DateTime.now(),
    ));
    return id;
  }

  @override
  Future<List<Property>> myListings() async {
    final u = _user;
    if (u == null) return [];
    return _items.where((p) => p.ownerId == u.uid).toList()..sort((a, b) => b.createdAt.compareTo(a.createdAt));
  }

  // ---------- revenue (demo: payments are approved at once so every screen can be tried) ----------

  final _payments = <PaymentInfo>[];
  DealerInfo? _dealer;
  int _pay = 0;

  @override
  Future<RevenueConfig> revenueConfig() async => const RevenueConfig(pricing: Pricing(upiId: 'onlineland@demo'));

  @override
  Future<DealerInfo?> myDealer() async => _user == null ? null : _dealer;

  @override
  Future<void> submitPayment({required String kind, String? planId, String? propertyId, required int amountInr, required String utr}) async {
    final u = _user;
    if (u == null) throw RepoException('unauthenticated', 'Sign in first');
    if (!utrPattern.hasMatch(utr)) throw RepoException('invalid-argument', 'UTR must be 12 digits');
    _payments.insert(0, PaymentInfo(
      id: 'demo-pay-${++_pay}', kind: kind, planId: planId, propertyId: propertyId, amountInr: amountInr, utr: utr,
      status: 'approved', createdAt: DateTime.now(),
    ));
    if (kind == 'plan' && planId != null) {
      final plan = defaultPlans[planId]!;
      _dealer = DealerInfo(planId: planId, validUntil: DateTime.now().add(Duration(days: plan.durationDays)), featuredSlots: plan.featuredSlots);
      if (u.role == 'buyer' || u.role == 'owner') {
        _user = AppUser(uid: u.uid, phone: u.phone, role: 'dealer');
        _auth.add(_user);
      }
    }
  }

  @override
  Future<List<PaymentInfo>> myPayments() async => List.of(_payments);

  @override
  Future<List<LeadInfo>> myLeads() async {
    final d = _dealer;
    if (_user == null || d == null || !d.active(DateTime.now()) || !defaultPlans[d.planId]!.ownContact) {
      throw RepoException('permission-denied', 'Needs an active plan');
    }
    return [
      LeadInfo(id: 'demo-lead-1', propertyId: 'seed-1001', channel: 'form', name: 'Lakshmi', phone: '9876500000', message: 'ధర తగ్గుతుందా?', createdAt: _now.subtract(const Duration(hours: 3))),
      LeadInfo(id: 'demo-lead-2', propertyId: 'seed-1002', channel: 'whatsapp', createdAt: _now.subtract(const Duration(days: 1))),
    ];
  }

  @override
  Future<ListingStats> listingStats(String propertyId) async {
    final h = propertyId.codeUnits.fold<int>(7, (a, c) => (a * 31 + c) % 997);
    return ListingStats(views: 20 + h % 80, shares: h % 9, leads: h % 4);
  }

  @override
  Future<void> useFeaturedSlot(String propertyId) async {
    final d = _dealer;
    if (d == null || !d.active(DateTime.now())) throw RepoException('failed-precondition', 'Plan not active');
    if (d.slotsLeft <= 0) throw RepoException('resource-exhausted', 'No featured slots left');
    _dealer = DealerInfo(planId: d.planId, validUntil: d.validUntil, verified: d.verified, featuredSlots: d.featuredSlots, featuredUsed: d.featuredUsed + 1);
  }

  @override
  Future<void> track(String propertyId, String type) async {}

  @override
  Future<void> syncFavorite(String propertyId, bool saved) async {}

  @override
  Future<void> registerDevice(String token) async {}

  static List<Property> _seed(DateTime now) {
    DateTime ago(int d) => now.subtract(Duration(days: d));
    Property p(String n, String cat, String purpose, String te, String en, num price, String basis, num area, String unit, Place place, int age,
            {bool featured = false, bool verified = false, String? facing, bool? road, String? water, String dte = '', String den = ''}) =>
        Property(
          id: 'seed-$n',
          code: 'OL-$n',
          category: cat,
          purpose: purpose,
          titleTe: te,
          titleEn: en,
          descriptionTe: dte,
          descriptionEn: den,
          price: price,
          priceBasis: basis,
          area: area,
          areaUnit: unit,
          place: place,
          facing: facing,
          roadAccess: road,
          waterSource: water,
          status: 'approved',
          isFeatured: featured,
          docsVerified: verified,
          ownerId: 'seed-owner',
          createdAt: ago(age),
        );
    return [
      p('1001', 'agricultural', 'sale', 'బోర్‌వెల్ ఉన్న వ్యవసాయ భూమి', 'Farmland with borewell', 1400000, 'per-unit', 5, 'acre',
          const Place(district: 'narayanpet', mandal: 'makthal', village: 'Makthal', lat: 16.5007, lng: 77.5126), 1,
          featured: true, verified: true, facing: 'east', road: true, water: 'Borewell',
          dte: 'మక్తల్ నుంచి 4 కి.మీ. దూరంలో ఎర్ర నేల. రెండు బోర్‌వెల్స్, మట్టి రోడ్డు సౌకర్యం. పత్రాలు సిద్ధంగా ఉన్నాయి.',
          den: 'Red soil, 4 km from Makthal. Two borewells and a mud road to the field. Documents ready.'),
      p('1002', 'open-plot', 'sale', 'తూర్పు ముఖ ఓపెన్ ప్లాట్', 'East-facing open plot', 1600000, 'total', 200, 'sq-yd',
          const Place(district: 'narayanpet', mandal: 'makthal', village: 'Makthal town'), 2, facing: 'east', road: true),
      p('1003', 'agricultural', 'sale', 'కాలువ పక్కన వ్యవసాయ భూమి', 'Farmland next to the canal', 1200000, 'per-unit', 10, 'acre',
          const Place(district: 'narayanpet', mandal: 'maganoor', village: 'Maganoor'), 3),
      p('1004', 'agricultural', 'sale', 'చిన్న రైతుకు 2 ఎకరాలు', '2 acres for a small farmer', 900000, 'per-unit', 2, 'acre',
          const Place(district: 'narayanpet', mandal: 'utkoor', village: 'Utkoor'), 4),
      p('1005', 'farmhouse', 'sale', 'మామిడి తోటతో ఫామ్‌హౌస్', 'Farmhouse with mango orchard', 12000000, 'total', 1, 'acre',
          const Place(district: 'rangareddy', mandal: 'Shadnagar', village: 'Shadnagar'), 5),
      p('1006', 'flat', 'sale', '2BHK ఫ్లాట్, గేటెడ్ కమ్యూనిటీ', '2BHK flat in a gated community', 6800000, 'total', 1150, 'sq-ft',
          const Place(district: 'medchal-malkajgiri', mandal: 'Kukatpally', village: 'Kukatpally'), 6),
      p('1007', 'villa', 'sale', '4BHK విల్లా', '4BHK villa', 24000000, 'total', 300, 'sq-yd',
          const Place(district: 'sangareddy', mandal: 'Ramachandrapuram', village: 'Tellapur'), 7),
      p('1008', 'rental', 'rent', '2BHK ఇండిపెండెంట్ ఇల్లు', '2BHK independent house', 9000, 'per-month', 900, 'sq-ft',
          const Place(district: 'mahabubnagar', mandal: 'Mahabubnagar', village: 'Mahabubnagar town'), 8),
      p('1009', 'commercial', 'sale', 'మెయిన్ రోడ్డు పై వాణిజ్య స్థలం', 'Commercial plot on the main road', 9000000, 'total', 400, 'sq-yd',
          const Place(district: 'mahabubnagar', mandal: 'Mahabubnagar', village: 'Mahabubnagar town'), 9, road: true),
      p('1010', 'open-plot', 'sale', 'నారాయణపేట టౌన్‌లో ప్లాట్', 'Plot in Narayanpet town', 900000, 'total', 150, 'sq-yd',
          const Place(district: 'narayanpet', mandal: 'narayanpet', village: 'Narayanpet town'), 10),
    ];
  }
}
