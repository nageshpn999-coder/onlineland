import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';

import '../config.dart';
import 'media.dart';
import 'models.dart';
import 'repository.dart';

/// Talks to onlineland-dev / onlineland-prod. Every write here is validated by firebase/firestore.rules.
class FirebaseRepository implements Repository {
  FirebaseRepository()
      : _db = FirebaseFirestore.instance,
        _auth = FirebaseAuth.instance,
        _storage = FirebaseStorage.instance,
        _functions = FirebaseFunctions.instanceFor(region: AppConfig.functionsRegion);

  final FirebaseFirestore _db;
  final FirebaseAuth _auth;
  final FirebaseStorage _storage;
  final FirebaseFunctions _functions;
  AppUser? _user;

  @override
  bool get isDemo => false;

  // ---------- listings ----------

  static Property fromDoc(DocumentSnapshot<Map<String, dynamic>> doc, {List<String> photos = const [], List<ListingVideo> videos = const []}) {
    final d = doc.data() ?? const {};
    Map<String, dynamic> map(Object? v) => v is Map ? Map<String, dynamic>.from(v) : <String, dynamic>{};
    final title = map(d['title']);
    final desc = map(d['description']);
    final loc = map(d['location']);
    final created = d['createdAt'];
    return Property(
      id: doc.id,
      code: d['code'] as String?,
      category: (d['category'] ?? '') as String,
      purpose: (d['purpose'] ?? 'sale') as String,
      titleTe: (title['te'] ?? '') as String,
      titleEn: (title['en'] ?? '') as String,
      descriptionTe: (desc['te'] ?? '') as String,
      descriptionEn: (desc['en'] ?? '') as String,
      price: (d['price'] ?? 0) as num,
      priceBasis: (d['priceBasis'] ?? 'total') as String,
      area: (d['area'] ?? 0) as num,
      areaUnit: (d['areaUnit'] ?? 'acre') as String,
      place: Place(
        district: (loc['district'] ?? '') as String,
        mandal: (loc['mandal'] ?? '') as String,
        village: (loc['village'] ?? '') as String,
        lat: (loc['lat'] as num?)?.toDouble(),
        lng: (loc['lng'] as num?)?.toDouble(),
      ),
      facing: d['facing'] as String?,
      roadAccess: d['roadAccess'] as bool?,
      waterSource: d['waterSource'] as String?,
      coverPath: d['coverPath'] as String?,
      photos: photos,
      videos: videos,
      status: (d['status'] ?? '') as String,
      isFeatured: d['isFeatured'] == true,
      docsVerified: d['docsVerified'] == true,
      rejectReason: d['rejectReason'] as String?,
      ownerId: (d['ownerId'] ?? '') as String,
      createdAt: created is Timestamp ? created.toDate() : DateTime.fromMillisecondsSinceEpoch(0),
    );
  }

  @override
  Future<List<Property>> approvedProperties() async {
    final snap = await _db
        .collection('properties')
        .where('status', isEqualTo: 'approved')
        .orderBy('createdAt', descending: true)
        .limit(500)
        .get();
    return snap.docs.map((d) => fromDoc(d)).toList();
  }

  @override
  Future<Property?> propertyByCode(String code) async {
    final snap = await _db.collection('properties').where('status', isEqualTo: 'approved').where('code', isEqualTo: code).limit(1).get();
    if (snap.docs.isEmpty) return null;
    final doc = snap.docs.first;
    final media = await doc.reference.collection('media').orderBy('order').limit(25).get();
    final photos = <String>[];
    final videos = <ListingVideo>[];
    for (final m in media.docs) {
      final d = m.data();
      final type = (d['type'] as String?) ?? 'photo';
      final path = d['storagePath'] as String?;
      if (type == 'photo' && path != null) {
        photos.add(path);
      } else if (type == 'video' && path != null) {
        videos.add(FileVideo(path, posterPath: d['posterPath'] as String?, durationSec: (d['durationSec'] as num?)?.toInt()));
      } else if (type == 'youtube' && d['youtubeId'] is String) {
        videos.add(YouTubeVideo(d['youtubeId'] as String));
      }
    }
    return fromDoc(doc, photos: photos, videos: videos);
  }

  @override
  String photoUrl(String path) {
    final host = AppConfig.emulatorHost.isNotEmpty ? 'http://${AppConfig.emulatorHost}:9199' : 'https://firebasestorage.googleapis.com';
    return '$host/v0/b/${AppConfig.storageBucket}/o/${Uri.encodeComponent(path)}?alt=media';
  }

  // ---------- leads ----------

  @override
  Future<void> createLead({required String? propertyId, required String channel, required String locale, String? name, String? phone, String? message}) async {
    await _leadRef(propertyId: propertyId, channel: channel, locale: locale, name: name, phone: phone, message: message);
  }

  Future<DocumentReference<Map<String, dynamic>>> _leadRef({required String? propertyId, required String channel, required String locale, String? name, String? phone, String? message}) {
    String? clean(String? v) => (v == null || v.trim().isEmpty) ? null : v.trim();
    return _db.collection('leads').add({
      'propertyId': propertyId,
      'channel': channel,
      'name': clean(name),
      'phone': clean(phone),
      'message': clean(message),
      'locale': locale,
      'userId': _auth.currentUser?.uid,
      'stage': 'new',
      'assignedAgentId': null,
      'notes': null,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  @override
  Future<void> createSiteVisit({required String propertyId, required String name, required String phone, required String date, required String slot, required String locale}) async {
    final lead = await _leadRef(propertyId: propertyId, channel: 'site-visit', locale: locale, name: name, phone: phone, message: '$date $slot');
    await _db.collection('siteVisits').add({
      'propertyId': propertyId,
      'leadId': lead.id,
      'name': name.trim(),
      'phone': phone,
      'date': date,
      'slot': slot,
      'status': 'requested',
      'userId': _auth.currentUser?.uid,
      'agentId': null,
      'notes': null,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  // ---------- auth ----------

  Future<AppUser?> _toAppUser(User? u, {bool refresh = false}) async {
    if (u == null) return null;
    final token = await u.getIdTokenResult(refresh);
    return AppUser(uid: u.uid, phone: u.phoneNumber, role: (token.claims?['role'] as String?) ?? 'buyer');
  }

  @override
  Stream<AppUser?> authChanges() => _auth.idTokenChanges().asyncMap((u) async => _user = await _toAppUser(u));

  @override
  AppUser? get currentUser => _user;

  @override
  Future<String> sendOtp(String phone10) {
    final result = Completer<String>();
    _auth.verifyPhoneNumber(
      phoneNumber: '+91$phone10',
      timeout: const Duration(seconds: 60),
      verificationCompleted: (credential) async {
        // Android can read the SMS itself; sign in straight away.
        await _auth.signInWithCredential(credential);
        if (!result.isCompleted) result.complete('auto');
      },
      verificationFailed: (e) {
        if (!result.isCompleted) result.completeError(RepoException(e.code, e.message ?? 'Verification failed'));
      },
      codeSent: (verificationId, _) {
        if (!result.isCompleted) result.complete(verificationId);
      },
      codeAutoRetrievalTimeout: (_) {},
    );
    return result.future;
  }

  @override
  Future<AppUser> verifyOtp(String verificationId, String code) async {
    if (verificationId == 'auto' && _auth.currentUser != null) return (await _toAppUser(_auth.currentUser))!;
    try {
      final cred = await _auth.signInWithCredential(PhoneAuthProvider.credential(verificationId: verificationId, smsCode: code));
      return (await _toAppUser(cred.user))!;
    } on FirebaseAuthException catch (e) {
      throw RepoException(e.code, e.message ?? 'Sign-in failed');
    }
  }

  @override
  Future<void> signOut() => _auth.signOut();

  @override
  Future<void> deleteAccount() async {
    try {
      await _functions.httpsCallable('deleteMyAccount').call();
    } on FirebaseFunctionsException catch (e) {
      throw RepoException(e.code, e.message ?? e.code);
    }
    await _auth.signOut();
  }

  @override
  Future<String> becomeOwner() async {
    final res = await _functions.httpsCallable('becomeOwner').call<Map<String, dynamic>>();
    await _auth.currentUser?.getIdToken(true);
    _user = await _toAppUser(_auth.currentUser, refresh: true);
    return (res.data['role'] as String?) ?? 'owner';
  }

  // ---------- owner listings ----------

  @override
  Future<String> submitListing(ListingDraft d, List<Uint8List> photos,
      {VideoAttachment? video, void Function(int done, int total)? onProgress}) async {
    final user = _auth.currentUser;
    if (user == null) throw RepoException('unauthenticated', 'Sign in first');
    final role = currentUser?.role ?? 'buyer';
    final ref = _db.collection('properties').doc();
    // 1) Create as draft (rules: owner may create draft/pending only).
    await ref.set({
      'category': d.category,
      'purpose': d.purpose,
      'title': {'te': d.title.trim(), 'en': ''},
      'description': {'te': d.description.trim(), 'en': ''},
      'price': d.price,
      'priceBasis': d.priceBasis,
      'area': d.area,
      'areaUnit': d.areaUnit,
      'location': {'district': d.district, 'mandal': d.mandal, 'village': d.village.trim(), 'lat': d.lat, 'lng': d.lng},
      'facing': d.facing,
      'roadAccess': d.roadAccess,
      'waterSource': null,
      'rera': null,
      'coverPath': null,
      'photoCount': 0,
      'code': null,
      'ownerId': user.uid,
      'source': role == 'dealer' ? 'dealer' : (role == 'admin' ? 'onlineland' : 'owner'),
      'status': 'draft',
      'isFeatured': false,
      'featuredUntil': null,
      'docsVerified': false,
      'rejectReason': null,
      'reviewedBy': null,
      'reviewedAt': null,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    });
    // 2) Owner contact stays private (D3).
    if (d.ownerPhone.isNotEmpty) {
      await ref.collection('private').doc('contact').set({
        'ownerName': d.ownerName.trim(),
        'ownerPhone': d.ownerPhone,
        'address': null,
        'commissionTerms': null,
      });
    }
    // 3) Photos (storage rules check this user owns the listing).
    final paths = <String>[];
    for (var i = 0; i < photos.length; i++) {
      final path = 'properties/${ref.id}/photo-${DateTime.now().millisecondsSinceEpoch}-$i.jpg';
      await _storage.ref(path).putData(photos[i], SettableMetadata(contentType: 'image/jpeg'));
      await ref.collection('media').add({'storagePath': path, 'order': i, 'isCover': i == 0, 'createdAt': FieldValue.serverTimestamp()});
      paths.add(path);
      onProgress?.call(i + 1, photos.length);
    }
    // 4) Video: compressed MP4 + poster frame, or a YouTube link.
    final stamp = DateTime.now().millisecondsSinceEpoch;
    switch (video) {
      case PreparedVideo v:
        final vpath = 'properties/${ref.id}/videos/video-$stamp.mp4';
        String? ppath;
        if (v.poster != null) {
          ppath = 'properties/${ref.id}/videos/video-$stamp.jpg';
          await _storage.ref(ppath).putData(v.poster!, SettableMetadata(contentType: 'image/jpeg'));
        }
        await _storage.ref(vpath).putFile(File(v.filePath), SettableMetadata(contentType: 'video/mp4'));
        await ref.collection('media').add({
          'type': 'video', 'storagePath': vpath, 'posterPath': ppath, 'durationSec': v.durationSec.clamp(1, 120),
          'order': 100, 'isCover': false, 'createdAt': FieldValue.serverTimestamp(),
        });
      case YouTubeAttachment y:
        await ref.collection('media').add({
          'type': 'youtube', 'storagePath': null, 'youtubeId': y.id, 'order': 100, 'isCover': false, 'createdAt': FieldValue.serverTimestamp(),
        });
      case null:
        break;
    }
    // 5) Submit for review.
    await ref.update({
      'coverPath': paths.isEmpty ? null : paths.first,
      'photoCount': paths.length,
      'status': 'pending',
      'updatedAt': FieldValue.serverTimestamp(),
    });
    return ref.id;
  }

  @override
  Future<List<Property>> myListings() async {
    final user = _auth.currentUser;
    if (user == null) return [];
    final snap = await _db.collection('properties').where('ownerId', isEqualTo: user.uid).orderBy('createdAt', descending: true).limit(100).get();
    return snap.docs.map((d) => fromDoc(d)).toList();
  }

  // ---------- revenue (D7) ----------

  static DateTime? _date(Object? v) => v is Timestamp ? v.toDate() : null;

  @override
  Future<RevenueConfig> revenueConfig() async {
    final results = await Future.wait([_db.collection('plans').get(), _db.doc('settings/pricing').get()]);
    final planSnap = results[0] as QuerySnapshot<Map<String, dynamic>>;
    final pricingSnap = results[1] as DocumentSnapshot<Map<String, dynamic>>;
    final plans = Map<String, PlanConfig>.of(defaultPlans);
    for (final d in planSnap.docs) {
      final base = defaultPlans[d.id];
      if (base != null) plans[d.id] = base.merge(d.data());
    }
    return RevenueConfig(plans: plans, pricing: Pricing.fromMap(pricingSnap.data() ?? const {}));
  }

  @override
  Future<DealerInfo?> myDealer() async {
    final user = _auth.currentUser;
    if (user == null) return null;
    final d = (await _db.doc('dealers/${user.uid}').get()).data();
    if (d == null) return null;
    return DealerInfo(
      planId: (d['planId'] as String?) ?? 'free',
      validUntil: _date(d['validUntil']),
      verified: d['verified'] == true,
      featuredSlots: (d['featuredSlots'] as num?)?.toInt() ?? 0,
      featuredUsed: (d['featuredUsed'] as num?)?.toInt() ?? 0,
    );
  }

  @override
  Future<void> submitPayment({required String kind, String? planId, String? propertyId, required int amountInr, required String utr}) async {
    final user = _auth.currentUser;
    if (user == null) throw RepoException('unauthenticated', 'Sign in first');
    if (!utrPattern.hasMatch(utr)) throw RepoException('invalid-argument', 'UTR must be 12 digits');
    await _db.collection('paymentRequests').add({
      'userId': user.uid,
      'kind': kind,
      'planId': kind == 'plan' ? planId : null,
      'propertyId': kind == 'plan' ? null : propertyId,
      'amountInr': amountInr,
      'utr': utr,
      'status': 'pending',
      'rejectReason': null,
      'reviewedBy': null,
      'reviewedAt': null,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  @override
  Future<List<PaymentInfo>> myPayments() async {
    final user = _auth.currentUser;
    if (user == null) return [];
    final snap = await _db.collection('paymentRequests').where('userId', isEqualTo: user.uid).orderBy('createdAt', descending: true).limit(30).get();
    return snap.docs.map((doc) {
      final d = doc.data();
      return PaymentInfo(
        id: doc.id,
        kind: (d['kind'] as String?) ?? 'plan',
        planId: d['planId'] as String?,
        propertyId: d['propertyId'] as String?,
        amountInr: (d['amountInr'] as num?)?.toInt() ?? 0,
        utr: (d['utr'] as String?) ?? '',
        status: (d['status'] as String?) ?? 'pending',
        rejectReason: d['rejectReason'] as String?,
        createdAt: _date(d['createdAt']) ?? DateTime.now(),
      );
    }).toList();
  }

  @override
  Future<List<LeadInfo>> myLeads() async {
    final user = _auth.currentUser;
    if (user == null) return [];
    try {
      final snap = await _db.collection('leads').where('refId', isEqualTo: user.uid).orderBy('createdAt', descending: true).limit(100).get();
      return snap.docs.map((doc) {
        final d = doc.data();
        return LeadInfo(
          id: doc.id,
          propertyId: d['propertyId'] as String?,
          channel: (d['channel'] as String?) ?? 'form',
          name: d['name'] as String?,
          phone: d['phone'] as String?,
          message: d['message'] as String?,
          createdAt: _date(d['createdAt']) ?? DateTime.now(),
        );
      }).toList();
    } on FirebaseException catch (e) {
      throw RepoException(e.code, e.message ?? e.code);
    }
  }

  @override
  Future<ListingStats> listingStats(String propertyId) async {
    final d = (await _db.doc('propertyStats/$propertyId').get()).data() ?? const {};
    int n(String k) => (d[k] as num?)?.toInt() ?? 0;
    return ListingStats(views: n('views'), shares: n('shares'), leads: n('leads'));
  }

  @override
  Future<void> useFeaturedSlot(String propertyId) async {
    try {
      await _functions.httpsCallable('useFeaturedSlot').call({'propertyId': propertyId});
    } on FirebaseFunctionsException catch (e) {
      throw RepoException(e.code, e.message ?? e.code);
    }
  }

  @override
  Future<void> track(String propertyId, String type) async {
    try {
      await _functions.httpsCallable('trackEvent').call({'propertyId': propertyId, 'type': type});
    } catch (_) {
      // stats are best effort
    }
  }

  @override
  Future<void> syncFavorite(String propertyId, bool saved) async {
    final user = _auth.currentUser;
    if (user == null) return;
    final ref = _db.doc('users/${user.uid}/favorites/$propertyId');
    if (saved) {
      await ref.set({'savedAt': FieldValue.serverTimestamp()});
    } else {
      await ref.delete();
    }
  }

  @override
  Future<void> registerDevice(String token) async {
    final user = _auth.currentUser;
    if (user == null || token.isEmpty || token.length > 400) return;
    if (token.contains('/')) return;
    await _db.doc('users/${user.uid}/devices/$token').set({
      'token': token,
      'platform': 'android',
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }
}
