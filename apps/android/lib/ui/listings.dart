import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../data/catalog.dart';
import '../data/filters.dart';
import '../data/geo.dart';
import '../data/models.dart';
import '../l10n.dart';
import '../state.dart';
import '../theme.dart';
import 'home.dart';
import 'widgets.dart';

class ListingsTab extends ConsumerWidget {
  const ListingsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final f = ref.watch(filtersProvider);
    final results = ref.watch(filteredProvider);
    final notifier = ref.read(filtersProvider.notifier);

    final chips = <String>[
      if (f.type != null) byId(categories, f.type)?.label(s.te) ?? '',
      if (f.district != null) byId(districts, f.district)?.label(s.te) ?? '',
      if (f.mandal != null) byId(mandals[f.district] ?? const [], f.mandal)?.label(s.te) ?? '',
      if (f.budget != null) budgetLabel(f, s),
    ];

    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
        child: Row(children: [
          Expanded(
            child: SegmentedButton<String>(
              segments: [ButtonSegment(value: 'sale', label: Text(s.buy)), ButtonSegment(value: 'rent', label: Text(s.rent))],
              selected: {f.purpose},
              showSelectedIcon: false,
              onSelectionChanged: (v) => notifier.set(f.copyWith(purpose: v.first)),
            ),
          ),
          const SizedBox(width: 10),
          Badge(
            isLabelVisible: f.activeCount > 0,
            label: Text('${f.activeCount}'),
            child: OutlinedButton.icon(
              key: const Key('open-filters'),
              style: OutlinedButton.styleFrom(minimumSize: const Size(0, 44)),
              onPressed: () => showModalBottomSheet<void>(
                context: context,
                isScrollControlled: true,
                showDragHandle: true,
                builder: (_) => const FilterSheet(),
              ),
              icon: const Icon(Icons.tune),
              label: Text(s.filters),
            ),
          ),
        ]),
      ),
      if (chips.isNotEmpty)
        SizedBox(
          height: 44,
          child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16), children: [
            for (final c in chips)
              Padding(
                padding: const EdgeInsets.only(right: 6),
                child: Chip(label: Text(c), backgroundColor: Brand.greenSoft, labelStyle: const TextStyle(color: Brand.green, fontWeight: FontWeight.w600)),
              ),
            TextButton(onPressed: notifier.reset, child: Text(s.clearAll)),
          ]),
        ),
      const _NearMeBar(),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 4, 8, 4),
        child: Row(children: [
          Expanded(
            child: Text(results.maybeWhen(data: (l) => s.count(l.length), orElse: () => ''),
                key: const Key('results-count'), style: const TextStyle(fontWeight: FontWeight.w700)),
          ),
          DropdownButton<String>(
            value: f.sort,
            underline: const SizedBox.shrink(),
            items: [
              DropdownMenuItem(value: 'newest', child: Text(s.sortNewest)),
              DropdownMenuItem(value: 'price-asc', child: Text(s.sortPriceAsc)),
              DropdownMenuItem(value: 'price-desc', child: Text(s.sortPriceDesc)),
              if (f.near != null) DropdownMenuItem(value: 'nearest', child: Text(s.sortNearest)),
            ],
            onChanged: (v) => notifier.set(f.copyWith(sort: v)),
          ),
        ]),
      ),
      Expanded(
        child: results.when(
          data: (list) => list.isEmpty
              ? _Empty(query: [f.purpose == 'rent' ? s.rent : s.buy, ...chips].join(', '))
              : RefreshIndicator(
                  onRefresh: () => ref.refresh(propertiesProvider.future),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                    itemCount: list.length,
                    separatorBuilder: (_, _) => const SizedBox(height: 14),
                    itemBuilder: (_, i) => PropertyCard(property: list[i], distance: _distance(f, list[i])),
                  ),
                ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (_, _) => ErrorRetry(onRetry: () => ref.invalidate(propertiesProvider)),
        ),
      ),
    ]);
  }
}

String budgetLabel(Filters f, S s) {
  final list = f.purpose == 'rent' ? rentBudgets : saleBudgets;
  for (final b in list) {
    if (b.$1 == f.budget) return s.te ? b.$3 : b.$2;
  }
  return '';
}

class _Empty extends ConsumerWidget {
  const _Empty({required this.query});
  final String query;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    return ListView(padding: const EdgeInsets.all(24), children: [
      const Icon(Icons.search_off, size: 48, color: Brand.inkSoft),
      const SizedBox(height: 12),
      Text(s.emptyTitle, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 6),
      Text(s.emptyBody, textAlign: TextAlign.center, style: const TextStyle(color: Brand.inkSoft)),
      const SizedBox(height: 18),
      FilledButton.icon(
        style: FilledButton.styleFrom(backgroundColor: Brand.green),
        onPressed: () => openWhatsApp(s.emptyMessage(query)),
        icon: const Icon(Icons.chat),
        label: Text(s.askWhatsapp),
      ),
    ]);
  }
}

/// Bottom sheet; every change applies at once.
class FilterSheet extends ConsumerWidget {
  const FilterSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final f = ref.watch(filtersProvider);
    final n = ref.read(filtersProvider.notifier);
    final mandalList = mandals[f.district] ?? const <Named>[];
    final budgets = f.purpose == 'rent' ? rentBudgets : saleBudgets;
    final count = ref.watch(filteredProvider).maybeWhen(data: (l) => l.length, orElse: () => 0);

    Widget select<T>({required Key key, required String label, required T? value, required List<DropdownMenuItem<T?>> items, required ValueChanged<T?> onChanged}) =>
        Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: DropdownButtonFormField<T?>(
            key: key,
            initialValue: value,
            isExpanded: true,
            decoration: InputDecoration(labelText: label),
            items: items,
            onChanged: onChanged,
          ),
        );

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, 16 + MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Row(children: [
            Expanded(child: Text(s.filters, style: Theme.of(context).textTheme.titleLarge)),
            TextButton(onPressed: n.reset, child: Text(s.clearAll)),
          ]),
          const SizedBox(height: 10),
          select<String>(
            key: const Key('filter-type'),
            label: s.type,
            value: f.type,
            items: [DropdownMenuItem(value: null, child: Text(s.anyType)), for (final c in categories) DropdownMenuItem(value: c.id, child: Text(c.label(s.te)))],
            onChanged: (v) => n.set(f.copyWith(type: () => v)),
          ),
          select<String>(
            key: const Key('filter-district'),
            label: s.district,
            value: f.district,
            items: [DropdownMenuItem(value: null, child: Text(s.anyDistrict)), for (final d in districts) DropdownMenuItem(value: d.id, child: Text(d.label(s.te)))],
            onChanged: (v) => n.set(f.copyWith(district: () => v)),
          ),
          if (mandalList.isNotEmpty)
            select<String>(
              key: ValueKey('filter-mandal-${f.district}'),
              label: s.mandal,
              value: f.mandal,
              items: [DropdownMenuItem(value: null, child: Text(s.anyMandal)), for (final m in mandalList) DropdownMenuItem(value: m.id, child: Text(m.label(s.te)))],
              onChanged: (v) => n.set(f.copyWith(mandal: () => v)),
            ),
          select<String>(
            key: ValueKey('filter-budget-${f.purpose}'),
            label: s.budget,
            value: f.budget,
            items: [DropdownMenuItem(value: null, child: Text(s.anyBudget)), for (final b in budgets) DropdownMenuItem(value: b.$1, child: Text(s.te ? b.$3 : b.$2))],
            onChanged: (v) => n.set(f.copyWith(budget: () => v)),
          ),
          FilledButton(onPressed: () => Navigator.of(context).pop(), child: Text('${s.showResults} (${s.count(count)})')),
        ]),
      ),
    );
  }
}

(double, bool)? _distance(Filters f, Property p) {
  final near = f.near;
  if (near == null) return null;
  final pt = listingPoint(p.place);
  return pt == null ? null : (distanceKm(near, pt.$1), pt.$2);
}

/// 📍 Near me: one tap to sort by distance from the phone; radius 5/10/25/50 km.
class _NearMeBar extends ConsumerStatefulWidget {
  const _NearMeBar();
  @override
  ConsumerState<_NearMeBar> createState() => _NearMeBarState();
}

class _NearMeBarState extends ConsumerState<_NearMeBar> {
  bool _busy = false;

  Future<void> _locate() async {
    final s = ref.read(stringsProvider);
    setState(() => _busy = true);
    LatLng? p;
    try {
      p = await ref.read(locatorProvider)();
    } catch (_) {
      p = null;
    }
    if (!mounted) return;
    setState(() => _busy = false);
    final msg = p == null ? s.locationDenied : (!inTelanganaArea(p) ? s.locationOutside : null);
    if (msg != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      return;
    }
    final n = ref.read(filtersProvider.notifier);
    n.set(ref.read(filtersProvider).nearMe(p!));
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final f = ref.watch(filtersProvider);
    final n = ref.read(filtersProvider.notifier);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 2, 16, 0),
      child: f.near == null
          ? Align(
              alignment: Alignment.centerLeft,
              child: OutlinedButton.icon(
                key: const Key('near-me'),
                style: OutlinedButton.styleFrom(foregroundColor: Brand.green, side: const BorderSide(color: Brand.green), minimumSize: const Size(0, 40)),
                onPressed: _busy ? null : _locate,
                icon: _busy ? const SizedBox.square(dimension: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.my_location, size: 18),
                label: Text(_busy ? s.locating : s.nearMe),
              ),
            )
          : Row(key: const Key('near-active'), children: [
              const Icon(Icons.my_location, size: 18, color: Brand.green),
              const SizedBox(width: 6),
              Expanded(child: Text(s.nearActive, style: const TextStyle(color: Brand.green, fontWeight: FontWeight.w700))),
              DropdownButton<int?>(
                key: const Key('near-radius'),
                value: f.radius,
                underline: const SizedBox.shrink(),
                items: [
                  DropdownMenuItem(value: null, child: Text(s.radiusAny)),
                  for (final r in nearRadiiKm) DropdownMenuItem(value: r, child: Text(s.radiusKm(r))),
                ],
                onChanged: (v) => n.set(f.copyWith(radius: () => v)),
              ),
              IconButton(key: const Key('near-off'), tooltip: s.nearOff, onPressed: () => n.set(f.nearOff()), icon: const Icon(Icons.close)),
            ]),
    );
  }
}
