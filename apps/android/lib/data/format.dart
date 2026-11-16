import 'catalog.dart';

String _trim(num n) {
  if (n == n.roundToDouble()) return n.toInt().toString();
  return n.toStringAsFixed(2).replaceFirst(RegExp(r'\.?0+$'), '');
}

/// Indian grouping: 1234567 → 12,34,567
String groupIndian(num n) {
  final s = n.round().toString();
  if (s.length <= 3) return s;
  final last3 = s.substring(s.length - 3);
  var rest = s.substring(0, s.length - 3);
  final parts = <String>[];
  while (rest.length > 2) {
    parts.insert(0, rest.substring(rest.length - 2));
    rest = rest.substring(0, rest.length - 2);
  }
  if (rest.isNotEmpty) parts.insert(0, rest);
  return '${parts.join(',')},$last3';
}

/// ₹16 లక్షలు / ₹1.2 crore / ₹9,000
String formatPrice(num rupees, bool te) {
  if (rupees >= 10000000) return te ? '₹${_trim(rupees / 10000000)} కోట్లు' : '₹${_trim(rupees / 10000000)} crore';
  if (rupees >= 100000) return te ? '₹${_trim(rupees / 100000)} లక్షలు' : '₹${_trim(rupees / 100000)} lakh';
  return '₹${groupIndian(rupees)}';
}

String formatArea(num area, String unit, bool te) {
  final u = byId(areaUnits, unit);
  var label = u?.label(te) ?? unit;
  if (!te && area == 1) label = label.replaceFirst(RegExp(r's$'), '');
  return '${groupIndian(area)} $label';
}

/// "1000000-2500000" → (1000000, 2500000); "10000000-" → (10000000, null)
(num, num?)? parseBudget(String? key) {
  if (key == null || key.isEmpty) return null;
  final m = RegExp(r'^(\d+)-(\d*)$').firstMatch(key);
  if (m == null) return null;
  final min = num.parse(m.group(1)!);
  final max = m.group(2)!.isEmpty ? null : num.parse(m.group(2)!);
  if (max != null && max <= min) return null;
  return (min, max);
}

/// "98765 43210", "+91 98765-43210", "09876543210" → "9876543210"
String normalizeMobile(String input) {
  final d = input.replaceAll(RegExp(r'\D'), '');
  if (d.length == 12 && d.startsWith('91')) return d.substring(2);
  if (d.length == 11 && d.startsWith('0')) return d.substring(1);
  return d;
}

bool isMobile(String digits) => RegExp(r'^[6-9]\d{9}$').hasMatch(digits);
