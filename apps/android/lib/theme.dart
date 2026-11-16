import 'package:material_ui/material_ui.dart';

/// OnlineLand brand (same as the website).
class Brand {
  static const blue = Color(0xFF1456C8);
  static const blueDeep = Color(0xFF0E3F96);
  static const green = Color(0xFF0F6B3F);
  static const greenSoft = Color(0xFFE4F1E9);
  static const ink = Color(0xFF102347);
  static const inkSoft = Color(0xFF4A5A78);
  static const mist = Color(0xFFEEF3FA);
  static const line = Color(0xFFCFDAEC);
  static const paper = Color(0xFFFFFFFF);
}

ThemeData buildTheme() {
  final scheme = ColorScheme.fromSeed(
    seedColor: Brand.blue,
    primary: Brand.blue,
    secondary: Brand.green,
    surface: Brand.paper,
    onSurface: Brand.ink,
  );
  final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(8));
  return ThemeData(
    colorScheme: scheme,
    scaffoldBackgroundColor: Brand.paper,
    appBarTheme: const AppBarTheme(
      backgroundColor: Brand.paper,
      foregroundColor: Brand.ink,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      centerTitle: false,
    ),
    textTheme: const TextTheme(
      headlineSmall: TextStyle(fontWeight: FontWeight.w700, color: Brand.ink, height: 1.35),
      titleLarge: TextStyle(fontWeight: FontWeight.w700, color: Brand.ink, height: 1.4),
      titleMedium: TextStyle(fontWeight: FontWeight.w600, color: Brand.ink, height: 1.45),
      bodyLarge: TextStyle(color: Brand.ink, height: 1.6),
      bodyMedium: TextStyle(color: Brand.ink, height: 1.6),
      bodySmall: TextStyle(color: Brand.inkSoft, height: 1.5),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Brand.line)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Brand.line)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Brand.blue, width: 2)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(minimumSize: const Size(0, 50), shape: shape, textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(minimumSize: const Size(0, 50), shape: shape, side: const BorderSide(color: Brand.blue), foregroundColor: Brand.blue),
    ),
    cardTheme: CardThemeData(
      color: Brand.paper,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: Brand.line)),
    ),
    navigationBarTheme: const NavigationBarThemeData(backgroundColor: Brand.paper, indicatorColor: Brand.greenSoft),
    chipTheme: const ChipThemeData(side: BorderSide(color: Brand.line)),
    dividerTheme: const DividerThemeData(color: Brand.line, space: 1),
  );
}
