import 'catalog.dart';
import 'media.dart';

class Place {
  final String district;
  final String mandal;
  final String village;
  final double? lat;
  final double? lng;
  const Place({required this.district, required this.mandal, required this.village, this.lat, this.lng});

  /// "Makthal town, మక్తల్, నారాయణపేట" — skips a village that only repeats the mandal.
  String label(bool te) {
    final d = byId(districts, district);
    final m = byId(mandals[district] ?? const [], mandal);
    final mandalName = m?.label(te) ?? mandal;
    final same = [mandal, m?.en, m?.te].whereType<String>().any((n) => n.toLowerCase() == village.trim().toLowerCase());
    final parts = <String>[if (village.isNotEmpty && !same) village, if (mandalName.isNotEmpty) mandalName, d?.label(te) ?? district];
    final out = <String>[];
    for (final p in parts) {
      if (!out.contains(p)) out.add(p);
    }
    return out.join(', ');
  }
}

class Property {
  final String id;
  final String? code;
  final String category;
  final String purpose; // sale | rent
  final String titleTe;
  final String titleEn;
  final String descriptionTe;
  final String descriptionEn;
  final num price;
  final String priceBasis; // total | per-unit | per-month
  final num area;
  final String areaUnit;
  final Place place;
  final String? facing;
  final bool? roadAccess;
  final String? waterSource;
  final String? coverPath;
  final List<String> photos;
  final List<ListingVideo> videos;
  final String status;
  final bool isFeatured;
  final bool docsVerified;
  final String? rejectReason;
  final String ownerId;
  final String? saleMode; // owners: self | assisted (Phase 9)
  final DateTime createdAt;

  const Property({
    required this.id,
    required this.code,
    required this.category,
    required this.purpose,
    required this.titleTe,
    required this.titleEn,
    this.descriptionTe = '',
    this.descriptionEn = '',
    required this.price,
    required this.priceBasis,
    required this.area,
    required this.areaUnit,
    required this.place,
    this.facing,
    this.roadAccess,
    this.waterSource,
    this.coverPath,
    this.photos = const [],
    this.videos = const [],
    required this.status,
    this.isFeatured = false,
    this.docsVerified = false,
    this.rejectReason,
    required this.ownerId,
    this.saleMode,
    required this.createdAt,
  });

  /// Total price (sale) or monthly rent; per-acre prices are multiplied by the area.
  num get total => priceBasis == 'per-unit' ? (price * area).round() : price;

  String title(bool te) => te ? (titleTe.isNotEmpty ? titleTe : titleEn) : (titleEn.isNotEmpty ? titleEn : titleTe);
  String description(bool te) => te ? (descriptionTe.isNotEmpty ? descriptionTe : descriptionEn) : (descriptionEn.isNotEmpty ? descriptionEn : descriptionTe);
}

/// What an owner fills in when posting a property.
class ListingDraft {
  String category = 'agricultural';
  String purpose = 'sale';
  String title = '';
  String description = '';
  num? price;
  String priceBasis = 'per-unit';
  num? area;
  String areaUnit = 'acre';
  String district = 'narayanpet';
  String mandal = 'makthal';
  String village = '';
  double? lat;
  double? lng;
  String? facing;
  bool? roadAccess;
  String ownerName = '';
  String ownerPhone = '';

  /// Owners only: 'self' (sell it myself) or 'assisted' (OnlineLand sells it, fee only on a sale). Null = not asked.
  String? saleMode;
}

class AppUser {
  final String uid;
  final String? phone;
  final String role;
  const AppUser({required this.uid, this.phone, this.role = 'buyer'});
  bool get canPost => role == 'owner' || role == 'dealer' || role == 'admin';
}

// ---------------------------------------------------------------- revenue (decision D7)

/// A subscription plan. Defaults mirror packages/shared/src/plans.ts (checked by test/catalog_test.dart);
/// live values come from plans/{id} in Firestore (edited in the admin dashboard).
class PlanConfig {
  final String id;
  final String nameTe;
  final String nameEn;
  final int priceInr;
  final int durationDays;
  final int yearlyPriceInr; // 0 = no yearly option
  final int listingLimit; // 0 = unlimited
  final int featuredSlots;
  final bool ownContact;
  final bool verifiedBadge;
  final bool dealerPage;
  final bool areaLeads;
  const PlanConfig({
    required this.id,
    required this.nameTe,
    required this.nameEn,
    required this.priceInr,
    required this.durationDays,
    this.yearlyPriceInr = 0,
    required this.listingLimit,
    required this.featuredSlots,
    required this.ownContact,
    required this.verifiedBadge,
    required this.dealerPage,
    required this.areaLeads,
  });
  String name(bool te) => te ? nameTe : nameEn;

  int price(String billing) => billing == 'year' ? yearlyPriceInr : priceInr;

  /// Months free when paying yearly instead of monthly.
  int get yearlySavingMonths =>
      priceInr <= 0 || yearlyPriceInr <= 0 ? 0 : ((priceInr * 12 - yearlyPriceInr) ~/ priceInr).clamp(0, 12);

  PlanConfig merge(Map<String, dynamic> d) {
    final n = d['name'] is Map ? Map<String, dynamic>.from(d['name'] as Map) : const <String, dynamic>{};
    int i(String k, int v) => (d[k] as num?)?.toInt() ?? v;
    bool b(String k, bool v) => d[k] is bool ? d[k] as bool : v;
    return PlanConfig(
      id: id,
      nameTe: (n['te'] as String?) ?? nameTe,
      nameEn: (n['en'] as String?) ?? nameEn,
      priceInr: i('priceInr', priceInr),
      durationDays: i('durationDays', durationDays),
      yearlyPriceInr: i('yearlyPriceInr', yearlyPriceInr),
      listingLimit: i('listingLimit', listingLimit),
      featuredSlots: i('featuredSlots', featuredSlots),
      ownContact: b('ownContact', ownContact),
      verifiedBadge: b('verifiedBadge', verifiedBadge),
      dealerPage: b('dealerPage', dealerPage),
      areaLeads: b('areaLeads', areaLeads),
    );
  }
}

const defaultPlans = <String, PlanConfig>{
  'free': PlanConfig(id: 'free', nameTe: 'ఉచితం', nameEn: 'Free', priceInr: 0, durationDays: 0, yearlyPriceInr: 0, listingLimit: 2, featuredSlots: 0,
      ownContact: false, verifiedBadge: false, dealerPage: false, areaLeads: false),
  'basic': PlanConfig(id: 'basic', nameTe: 'బేసిక్', nameEn: 'Basic', priceInr: 499, durationDays: 30, yearlyPriceInr: 4999, listingLimit: 15, featuredSlots: 0,
      ownContact: true, verifiedBadge: true, dealerPage: false, areaLeads: false),
  'pro': PlanConfig(id: 'pro', nameTe: 'ప్రో', nameEn: 'Pro', priceInr: 1499, durationDays: 30, yearlyPriceInr: 14999, listingLimit: 0, featuredSlots: 2,
      ownContact: true, verifiedBadge: true, dealerPage: true, areaLeads: true),
};

class Pricing {
  final int featuredWeekInr;
  final int featuredDays;
  final int ownerFreeListings;
  final int ownerListingInr;
  final int ownerListingDays;
  final String upiId;
  final String upiName;
  final double dealCommissionPct;
  final bool launchOfferActive;
  final String launchOfferPlan;
  final int launchOfferDays;
  final List<String> launchOfferDistricts; // empty = everywhere
  const Pricing({
    this.featuredWeekInr = 199,
    this.featuredDays = 7,
    this.ownerFreeListings = 1,
    this.ownerListingInr = 199,
    this.ownerListingDays = 90,
    this.upiId = '',
    this.upiName = 'OnlineLand Infra Private Limited',
    this.dealCommissionPct = 1,
    this.launchOfferActive = false,
    this.launchOfferPlan = 'basic',
    this.launchOfferDays = 90,
    this.launchOfferDistricts = const ['narayanpet'],
  });

  factory Pricing.fromMap(Map<String, dynamic> d) {
    const z = Pricing();
    int i(String k, int v) => (d[k] as num?)?.toInt() ?? v;
    return Pricing(
      featuredWeekInr: i('featuredWeekInr', z.featuredWeekInr),
      featuredDays: i('featuredDays', z.featuredDays),
      ownerFreeListings: i('ownerFreeListings', z.ownerFreeListings),
      ownerListingInr: i('ownerListingInr', z.ownerListingInr),
      ownerListingDays: i('ownerListingDays', z.ownerListingDays),
      upiId: (d['upiId'] as String?) ?? z.upiId,
      upiName: (d['upiName'] as String?) ?? z.upiName,
      dealCommissionPct: (d['dealCommissionPct'] as num?)?.toDouble() ?? z.dealCommissionPct,
      launchOfferActive: d['launchOfferActive'] is bool ? d['launchOfferActive'] as bool : z.launchOfferActive,
      launchOfferPlan: d['launchOfferPlan'] == 'pro' ? 'pro' : z.launchOfferPlan,
      launchOfferDays: i('launchOfferDays', z.launchOfferDays),
      launchOfferDistricts: d['launchOfferDistricts'] is List ? List<String>.from(d['launchOfferDistricts'] as List) : z.launchOfferDistricts,
    );
  }

  /// upi://pay link — opens GPay / PhonePe / Paytm with the amount filled in.
  Uri upiUri(int amountInr, String note) => Uri(scheme: 'upi', host: 'pay', queryParameters: {
        'pa': upiId,
        'pn': upiName,
        'am': amountInr.toStringAsFixed(2),
        'cu': 'INR',
        'tn': note,
      });
}

class RevenueConfig {
  final Map<String, PlanConfig> plans;
  final Pricing pricing;
  final Map<String, ServiceConfig> services;
  const RevenueConfig({this.plans = defaultPlans, this.pricing = const Pricing(), this.services = defaultServices});
}

// ---------------------------------------------------------------- paid services (Phase 9)

/// A paid service. Defaults mirror packages/shared/src/services.ts (checked by test/catalog_test.dart);
/// live values come from settings/services (edited in admin).
class ServiceConfig {
  final String id;
  final String nameTe;
  final String nameEn;
  final String descTe;
  final String descEn;
  final int? priceInr; // null = quoted after looking; 0 = free for the customer
  final bool active;
  const ServiceConfig({required this.id, required this.nameTe, required this.nameEn, required this.descTe, required this.descEn, this.priceInr, this.active = true});
  String name(bool te) => te ? nameTe : nameEn;
  String desc(bool te) => te ? descTe : descEn;

  ServiceConfig merge(Map<String, dynamic> d) => ServiceConfig(
        id: id,
        nameTe: nameTe,
        nameEn: nameEn,
        descTe: descTe,
        descEn: descEn,
        priceInr: d.containsKey('priceInr') ? (d['priceInr'] as num?)?.toInt() : priceInr,
        active: d['active'] is bool ? d['active'] as bool : active,
      );
}

const serviceIds = ['drone', 'documents', 'survey', 'registration', 'loan'];

const defaultServices = <String, ServiceConfig>{
  'drone': ServiceConfig(
      id: 'drone',
      nameTe: 'డ్రోన్ / వీడియో షూట్',
      nameEn: 'Drone / video shoot',
      descTe: 'మీ భూమిని పై నుంచి వీడియో తీసి listing లో పెడతాం. త్వరగా అమ్ముడవుతుంది.',
      descEn: 'We film your land from above and add it to the listing. It sells faster.',
      priceInr: 1999),
  'documents': ServiceConfig(
      id: 'documents',
      nameTe: 'డాక్యుమెంట్స్ చెక్',
      nameEn: 'Document check',
      descTe: 'కొనే ముందు పట్టా, EC, లింక్ డాక్యుమెంట్స్ న్యాయవాది చేత చెక్ చేయిస్తాం.',
      descEn: 'A lawyer checks the title, EC and link documents before you buy.',
      priceInr: 2999),
  'survey': ServiceConfig(
      id: 'survey',
      nameTe: 'సర్వే & హద్దులు',
      nameEn: 'Survey & boundaries',
      descTe: 'లైసెన్స్ ఉన్న సర్వేయర్ తో కొలత, హద్దు రాళ్ళు. ధర భూమిని బట్టి చెబుతాం.',
      descEn: 'Measurement and boundary stones by a licensed surveyor. Priced per land.'),
  'registration': ServiceConfig(
      id: 'registration',
      nameTe: 'రిజిస్ట్రేషన్ సహాయం',
      nameEn: 'Registration help',
      descTe: 'సేల్ డీడ్, స్టాంప్ డ్యూటీ, సబ్-రిజిస్ట్రార్ ఆఫీసు పని అంతా చూసుకుంటాం.',
      descEn: 'Sale deed, stamp duty and the sub-registrar office, handled for you.'),
  'loan': ServiceConfig(
      id: 'loan',
      nameTe: 'హోమ్ / ల్యాండ్ లోన్',
      nameEn: 'Home / land loan',
      descTe: 'బ్యాంకు లోన్ కి సహాయం. మీకు ఫీజు లేదు.',
      descEn: 'Help with a bank loan. No fee for you.',
      priceInr: 0),
};

/// serviceRequests/{id} as the customer sees it.
class ServiceRequestInfo {
  final String id;
  final String serviceId;
  final String? propertyId;
  final String status; // new | quoted | paid | in-progress | done | cancelled
  final int? quotedInr;
  final String? adminNote;
  final DateTime createdAt;
  const ServiceRequestInfo({required this.id, required this.serviceId, this.propertyId, required this.status, this.quotedInr, this.adminNote, required this.createdAt});
  bool get canPay => status == 'quoted' && (quotedInr ?? 0) > 0;
  bool get canCancel => status == 'new' || status == 'quoted';
}

/// dealers/{uid}: the user's plan and badge (written by Cloud Functions).
class DealerInfo {
  final String planId;
  final DateTime? validUntil;
  final bool verified;
  final int featuredSlots;
  final int featuredUsed;
  const DealerInfo({this.planId = 'free', this.validUntil, this.verified = false, this.featuredSlots = 0, this.featuredUsed = 0});
  bool active(DateTime now) => validUntil != null && validUntil!.isAfter(now);
  int get slotsLeft => (featuredSlots - featuredUsed).clamp(0, 99);
}

class PaymentInfo {
  final String id;
  final String kind; // plan | featured | listing | service
  final String? planId;
  final String billing; // month | year (plans)
  final String? propertyId;
  final int amountInr;
  final String utr;
  final String status; // pending | approved | rejected
  final String? rejectReason;
  final DateTime createdAt;
  const PaymentInfo({
    required this.id,
    required this.kind,
    this.planId,
    this.billing = 'month',
    this.propertyId,
    required this.amountInr,
    required this.utr,
    required this.status,
    this.rejectReason,
    required this.createdAt,
  });
}

/// An enquiry that came from the dealer's own share link.
class LeadInfo {
  final String id;
  final String? propertyId;
  final String channel;
  final String? name;
  final String? phone;
  final String? message;
  final DateTime createdAt;
  const LeadInfo({required this.id, this.propertyId, required this.channel, this.name, this.phone, this.message, required this.createdAt});
}

class ListingStats {
  final int views;
  final int shares;
  final int leads;
  const ListingStats({this.views = 0, this.shares = 0, this.leads = 0});
}

/// 12-digit UPI transaction reference.
final utrPattern = RegExp(r'^\d{12}$');

/// Link to share a listing. The owner's own link carries `?ref=<uid>` so enquiries are credited to them.
String shareLink(String code, String locale, {String? refId}) =>
    'https://onlineland.in/$locale/properties/$code${refId != null ? '?ref=${Uri.encodeQueryComponent(refId)}' : ''}';
