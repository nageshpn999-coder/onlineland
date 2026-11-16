import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'data/filters.dart';
import 'data/models.dart';
import 'data/repository.dart';
import 'l10n.dart';

/// Overridden in main() with the demo or Firebase repository.
final repositoryProvider = Provider<Repository>((ref) => throw UnimplementedError('repositoryProvider not set'));

/// Overridden in main() after SharedPreferences loads.
final prefsProvider = Provider<SharedPreferences>((ref) => throw UnimplementedError('prefsProvider not set'));

// ---------- language ----------

class LocaleNotifier extends Notifier<String> {
  @override
  String build() => ref.watch(prefsProvider).getString('locale') ?? 'te';

  void set(String code) {
    state = code;
    ref.read(prefsProvider).setString('locale', code);
  }
}

final localeProvider = NotifierProvider<LocaleNotifier, String>(LocaleNotifier.new);
final stringsProvider = Provider<S>((ref) => S(ref.watch(localeProvider) == 'te'));

class OnboardedNotifier extends Notifier<bool> {
  @override
  bool build() => ref.watch(prefsProvider).getBool('onboarded') ?? false;

  void done() {
    state = true;
    ref.read(prefsProvider).setBool('onboarded', true);
  }
}

final onboardedProvider = NotifierProvider<OnboardedNotifier, bool>(OnboardedNotifier.new);

// ---------- data ----------

final propertiesProvider = FutureProvider<List<Property>>((ref) => ref.watch(repositoryProvider).approvedProperties());

final propertyByCodeProvider = FutureProvider.family<Property?, String>((ref, code) => ref.watch(repositoryProvider).propertyByCode(code));

class FiltersNotifier extends Notifier<Filters> {
  @override
  Filters build() => const Filters();
  void set(Filters f) => state = f;
  void reset() => state = Filters(purpose: state.purpose);
}

final filtersProvider = NotifierProvider<FiltersNotifier, Filters>(FiltersNotifier.new);

final filteredProvider = Provider<AsyncValue<List<Property>>>((ref) {
  final f = ref.watch(filtersProvider);
  return ref.watch(propertiesProvider).whenData((list) => applyFilters(list, f));
});

final authProvider = StreamProvider<AppUser?>((ref) => ref.watch(repositoryProvider).authChanges());

final myListingsProvider = FutureProvider<List<Property>>((ref) {
  ref.watch(authProvider);
  return ref.watch(repositoryProvider).myListings();
});

// ---------- favorites (saved on the phone; mirrored to the account when logged in) ----------

class FavoriteItem {
  final String id;
  final String code;
  final String titleTe;
  final String titleEn;
  final num total;
  const FavoriteItem({required this.id, required this.code, required this.titleTe, required this.titleEn, required this.total});

  factory FavoriteItem.of(Property p) => FavoriteItem(id: p.id, code: p.code ?? '', titleTe: p.titleTe, titleEn: p.titleEn, total: p.total);
  factory FavoriteItem.fromJson(Map<String, dynamic> j) => FavoriteItem(
        id: j['id'] as String,
        code: j['code'] as String,
        titleTe: j['titleTe'] as String? ?? '',
        titleEn: j['titleEn'] as String? ?? '',
        total: j['total'] as num? ?? 0,
      );
  Map<String, dynamic> toJson() => {'id': id, 'code': code, 'titleTe': titleTe, 'titleEn': titleEn, 'total': total};
  String title(bool te) => te ? (titleTe.isNotEmpty ? titleTe : titleEn) : (titleEn.isNotEmpty ? titleEn : titleTe);
}

class FavoritesNotifier extends Notifier<List<FavoriteItem>> {
  static const _key = 'favorites.v1';

  @override
  List<FavoriteItem> build() {
    final raw = ref.watch(prefsProvider).getString(_key);
    if (raw == null) return const [];
    try {
      return (jsonDecode(raw) as List).map((e) => FavoriteItem.fromJson(Map<String, dynamic>.from(e as Map))).toList();
    } catch (_) {
      return const [];
    }
  }

  bool has(String id) => state.any((f) => f.id == id);

  void toggle(Property p) {
    final saved = !has(p.id);
    state = saved ? [FavoriteItem.of(p), ...state] : state.where((f) => f.id != p.id).toList();
    _persist();
    ref.read(repositoryProvider).syncFavorite(p.id, saved).catchError((_) {});
  }

  void remove(String id) {
    state = state.where((f) => f.id != id).toList();
    _persist();
    ref.read(repositoryProvider).syncFavorite(id, false).catchError((_) {});
  }

  void _persist() => ref.read(prefsProvider).setString(_key, jsonEncode(state.map((f) => f.toJson()).toList()));
}

final favoritesProvider = NotifierProvider<FavoritesNotifier, List<FavoriteItem>>(FavoritesNotifier.new);
