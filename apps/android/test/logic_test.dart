import 'package:flutter_test/flutter_test.dart';
import 'package:onlineland/data/demo_repository.dart';
import 'package:onlineland/data/filters.dart';
import 'package:onlineland/data/format.dart';
import 'package:onlineland/data/models.dart';

void main() {
  group('format', () {
    test('prices in lakh and crore, Telugu and English', () {
      expect(formatPrice(7000000, true), '₹70 లక్షలు');
      expect(formatPrice(12000000, true), '₹1.2 కోట్లు');
      expect(formatPrice(1600000, false), '₹16 lakh');
      expect(formatPrice(9000, true), '₹9,000');
      expect(groupIndian(1234567), '12,34,567');
    });
    test('areas', () {
      expect(formatArea(5, 'acre', true), '5 ఎకరాలు');
      expect(formatArea(1, 'acre', false), '1 Acre');
      expect(formatArea(1150, 'sq-ft', false), '1,150 Sq. ft');
    });
    test('mobile numbers', () {
      expect(normalizeMobile('+91 98765-43210'), '9876543210');
      expect(normalizeMobile('09876543210'), '9876543210');
      expect(isMobile('9876543210'), isTrue);
      expect(isMobile('1234567890'), isFalse);
      expect(isMobile('98765'), isFalse);
    });
    test('budgets', () {
      expect(parseBudget('1000000-2500000'), (1000000, 2500000));
      expect(parseBudget('10000000-'), (10000000, null));
      expect(parseBudget('9-1'), isNull);
    });
  });

  group('filters (same results as the website)', () {
    late List<Property> all;
    setUp(() async => all = await DemoRepository(now: DateTime(2026, 11, 17)).approvedProperties());
    List<String?> codes(Filters f) => applyFilters(all, f).map((p) => p.code).toList();

    test('sale listings, featured first', () {
      final r = codes(const Filters());
      expect(r.length, 9);
      expect(r.first, 'OL-1001');
    });
    test('type + district + mandal + budget', () {
      expect(codes(const Filters(type: 'agricultural', district: 'narayanpet')).length, 3);
      expect(codes(const Filters(type: 'agricultural', district: 'narayanpet', mandal: 'makthal')), ['OL-1001']);
      expect(codes(const Filters(type: 'agricultural', district: 'narayanpet', budget: '1000000-2500000')), ['OL-1004']);
      expect(codes(const Filters(purpose: 'rent')), ['OL-1008']);
    });
    test('sort by price', () {
      expect(codes(const Filters(district: 'narayanpet', sort: 'price-asc')).first, 'OL-1010');
      expect(codes(const Filters(sort: 'price-desc')).first, 'OL-1007');
    });
    test('changing district clears a mandal from another district; changing purpose clears budget', () {
      const f = Filters(district: 'narayanpet', mandal: 'makthal', budget: '0-1000000');
      expect(f.copyWith(district: () => 'hyderabad').mandal, isNull);
      expect(f.copyWith(purpose: 'rent').budget, isNull);
    });
    test('place labels do not repeat the mandal', () {
      const p = Place(district: 'narayanpet', mandal: 'makthal', village: 'Makthal');
      expect(p.label(true), 'మక్తల్, నారాయణపేట');
      expect(const Place(district: 'narayanpet', mandal: 'makthal', village: 'Makthal town').label(false), 'Makthal town, Makthal, Narayanpet');
    });
  });
}
