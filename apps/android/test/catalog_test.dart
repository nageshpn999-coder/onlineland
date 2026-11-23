import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:onlineland/data/catalog.dart';
import 'package:onlineland/data/geo.dart';
import 'package:onlineland/data/media.dart';
import 'package:onlineland/data/models.dart';

/// The app's lists must match packages/shared (used by the website and Cloud Functions).
void main() {
  final locations = File('../../packages/shared/src/locations.ts').readAsStringSync();
  final property = File('../../packages/shared/src/property.ts').readAsStringSync();
  final row = RegExp(r"\{ id: '([^']+)', name: \{ en: '([^']+)', te: '([^']+)' \} \}");
  final cat = RegExp(r"\{ id: '([^']+)', slug: '[^']+', label: \{ en: '([^']+)', te: '([^']+)' \} \}");

  test('districts and Narayanpet mandals match the shared list', () {
    final all = row.allMatches(locations).map((m) => '${m[1]}|${m[2]}|${m[3]}').toList();
    final expected = [
      for (final d in districts) '${d.id}|${d.en}|${d.te}',
      for (final m in mandals['narayanpet']!) '${m.id}|${m.en}|${m.te}',
    ];
    expect(all, expected);
  });

  test('categories match the shared list', () {
    final all = cat.allMatches(property).map((m) => '${m[1]}|${m[2]}|${m[3]}').toList();
    expect(all, [for (final c in categories) '${c.id}|${c.en}|${c.te}']);
  });

  test('plan defaults and prices match the shared D7 list', () {
    final plans = File('../../packages/shared/src/plans.ts').readAsStringSync();
    for (final p in defaultPlans.values) {
      final block = RegExp('${p.id}: \\{([\\s\\S]*?)\\n  \\},').firstMatch(plans)![1]!;
      int n(String k) => int.parse(RegExp('$k: (\\d+)').firstMatch(block)![1]!);
      bool b(String k) => RegExp('$k: (true|false)').firstMatch(block)![1] == 'true';
      expect(block, contains("te: '${p.nameTe}', en: '${p.nameEn}'"), reason: p.id);
      expect([n('priceInr'), n('durationDays'), n('listingLimit'), n('featuredSlots')], [p.priceInr, p.durationDays, p.listingLimit, p.featuredSlots], reason: p.id);
      expect([b('ownContact'), b('verifiedBadge'), b('dealerPage'), b('areaLeads')], [p.ownContact, p.verifiedBadge, p.dealerPage, p.areaLeads], reason: p.id);
    }
    const z = Pricing();
    int price(String k) => int.parse(RegExp('$k: (\\d+)').firstMatch(plans.substring(plans.indexOf('DEFAULT_PRICING')))![1]!);
    expect([price('featuredWeekInr'), price('featuredDays'), price('ownerFreeListings'), price('ownerListingInr'), price('ownerListingDays')],
        [z.featuredWeekInr, z.featuredDays, z.ownerFreeListings, z.ownerListingInr, z.ownerListingDays]);
  });

  test('share links carry the owner ref; UTR must be 12 digits', () {
    expect(shareLink('OL-1001', 'te'), 'https://onlineland.in/te/properties/OL-1001');
    expect(shareLink('OL-1001', 'en', refId: 'abc'), 'https://onlineland.in/en/properties/OL-1001?ref=abc');
    expect(utrPattern.hasMatch('412345678901'), isTrue);
    expect(utrPattern.hasMatch('41234567890'), isFalse);
    const p = Pricing(upiId: 'onlineland@okaxis');
    final uri = p.upiUri(499, 'OnlineLand Basic');
    expect(uri.scheme, 'upi');
    expect(uri.queryParameters['pa'], 'onlineland@okaxis');
    expect(uri.queryParameters['am'], '499.00');
  });

  test('near-me centres match packages/shared/src/geo.ts and cover every district and mandal', () {
    final ts = File('../../packages/shared/src/geo.ts').readAsStringSync();
    final parts = ts.split('export const MANDAL_CENTERS');
    final re = RegExp(r"^\s+'?([a-z-]+)'?: \{ lat: ([\d.]+), lng: ([\d.]+) \},", multiLine: true);
    final tsDistricts = {for (final m in re.allMatches(parts[0])) m[1]!: (double.parse(m[2]!), double.parse(m[3]!))};
    final tsMandals = {for (final m in re.allMatches(parts[1].split('export const NEAR_RADII_KM')[0])) m[1]!: (double.parse(m[2]!), double.parse(m[3]!))};
    expect(districtCenters.map((k, v) => MapEntry(k, (v.lat, v.lng))), tsDistricts);
    expect(mandalCenters['narayanpet']!.map((k, v) => MapEntry(k, (v.lat, v.lng))), tsMandals);
    for (final d in districts) {
      expect(districtCenters[d.id], isNotNull, reason: d.id);
    }
    for (final m in mandals['narayanpet']!) {
      expect(mandalCenters['narayanpet']![m.id], isNotNull, reason: m.id);
    }
    final km = distanceKm((lat: 16.5021, lng: 77.5075), mandalCenters['narayanpet']!['narayanpet']!);
    expect(km, inInclusiveRange(25, 30));
    expect(formatKm(3.24, true, 'km'), '3.2 km');
    expect(formatKm(12.6, false, 'km'), '~13 km');
  });

  test('video limits and YouTube parsing match packages/shared/src/media.ts', () {
    final ts = File('../../packages/shared/src/media.ts').readAsStringSync();
    expect(RegExp(r'maxSeconds: (\d+)').firstMatch(ts)![1], '$videoMaxSeconds');
    expect(RegExp(r'maxBytes: (\d+) \* 1024 \* 1024').firstMatch(ts)![1], '${videoMaxBytes ~/ (1024 * 1024)}');
    for (final ok in ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtu.be/dQw4w9WgXcQ', 'https://youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ']) {
      expect(parseYouTubeId(ok), 'dQw4w9WgXcQ', reason: ok);
    }
    for (final bad in ['', 'https://vimeo.com/1', 'https://evil.com/watch?v=dQw4w9WgXcQ']) {
      expect(parseYouTubeId(bad), isNull, reason: bad);
    }
    expect(mmss(75), '1:15');
  });
}
