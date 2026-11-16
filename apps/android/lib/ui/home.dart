import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../data/catalog.dart';
import '../data/filters.dart';
import '../state.dart';
import '../theme.dart';
import 'favorites.dart';
import 'listings.dart';
import 'onboarding.dart';
import 'profile.dart';
import 'sell.dart';
import 'widgets.dart';

/// Bottom navigation: Home, Properties, Saved, Sell, Profile.
class HomeShell extends ConsumerStatefulWidget {
  const HomeShell({super.key});

  @override
  ConsumerState<HomeShell> createState() => HomeShellState();
}

class HomeShellState extends ConsumerState<HomeShell> {
  int index = 0;
  void go(int i) => setState(() => index = i);

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final savedCount = ref.watch(favoritesProvider).length;
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(children: [
          const DemoBanner(),
          Expanded(
            child: IndexedStack(index: index, children: [
              HomeTab(onBrowse: () => go(1), onSell: () => go(3)),
              const ListingsTab(),
              const FavoritesTab(),
              const SellTab(),
              const ProfileTab(),
            ]),
          ),
        ]),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: index,
        onDestinationSelected: go,
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), selectedIcon: const Icon(Icons.home), label: s.tabHome),
          NavigationDestination(icon: const Icon(Icons.search), label: s.tabSearch),
          NavigationDestination(
            icon: Badge(isLabelVisible: savedCount > 0, label: Text('$savedCount'), child: const Icon(Icons.favorite_border)),
            selectedIcon: const Icon(Icons.favorite),
            label: s.tabSaved,
          ),
          NavigationDestination(icon: const Icon(Icons.add_circle_outline), selectedIcon: const Icon(Icons.add_circle), label: s.tabSell),
          NavigationDestination(icon: const Icon(Icons.person_outline), selectedIcon: const Icon(Icons.person), label: s.tabProfile),
        ],
      ),
    );
  }
}

class HomeTab extends ConsumerWidget {
  const HomeTab({super.key, required this.onBrowse, required this.onSell});
  final VoidCallback onBrowse;
  final VoidCallback onSell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final props = ref.watch(propertiesProvider);

    void browse(Filters f) {
      ref.read(filtersProvider.notifier).set(f);
      onBrowse();
    }

    return RefreshIndicator(
      onRefresh: () => ref.refresh(propertiesProvider.future),
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          Container(
            color: Brand.mist,
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 22),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const LogoMark(size: 30),
                const SizedBox(width: 8),
                const Wordmark(size: 20),
                const Spacer(),
                TextButton(
                  onPressed: () => ref.read(localeProvider.notifier).set(s.te ? 'en' : 'te'),
                  child: Text(s.te ? 'EN' : 'తె', style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
              ]),
              const SizedBox(height: 18),
              Text(s.tagline, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontSize: 28)),
              const SizedBox(height: 14),
              Material(
                color: Brand.paper,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: Brand.line)),
                child: InkWell(
                  key: const Key('home-search'),
                  borderRadius: BorderRadius.circular(8),
                  onTap: () => browse(ref.read(filtersProvider)),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
                    child: Row(children: [
                      const Icon(Icons.search, color: Brand.blue),
                      const SizedBox(width: 10),
                      Expanded(child: Text(s.searchHint, style: const TextStyle(color: Brand.inkSoft, fontSize: 15.5))),
                    ]),
                  ),
                ),
              ),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 22, 16, 8),
            child: Text(s.whatLooking, style: Theme.of(context).textTheme.titleLarge),
          ),
          GridView.count(
            crossAxisCount: 3,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            mainAxisSpacing: 8,
            crossAxisSpacing: 8,
            childAspectRatio: 0.95,
            children: [
              for (final c in categories)
                Material(
                  color: c.id == 'agricultural' ? Brand.greenSoft : Brand.paper,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: Brand.line)),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(8),
                    onTap: () => browse(Filters(purpose: c.id == 'rental' ? 'rent' : 'sale', type: c.id)),
                    child: Padding(
                      padding: const EdgeInsets.all(10),
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(categoryIcon(c.id), color: c.id == 'agricultural' ? Brand.green : Brand.blue, size: 30),
                        const SizedBox(height: 8),
                        Text(c.label(s.te), textAlign: TextAlign.center, maxLines: 2, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, height: 1.35)),
                      ]),
                    ),
                  ),
                ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 26, 8, 8),
            child: Row(children: [
              Expanded(child: Text(s.featured, style: Theme.of(context).textTheme.titleLarge)),
              TextButton(onPressed: () => browse(const Filters()), child: Text(s.viewAll)),
            ]),
          ),
          props.when(
            data: (list) {
              final top = [...list.where((p) => p.isFeatured), ...list.where((p) => !p.isFeatured)].take(6).toList();
              return Column(children: [
                for (final p in top)
                  Padding(padding: const EdgeInsets.fromLTRB(16, 0, 16, 14), child: PropertyCard(property: p)),
              ]);
            },
            loading: () => const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator())),
            error: (_, _) => ErrorRetry(onRetry: () => ref.invalidate(propertiesProvider)),
          ),
          Container(
            margin: const EdgeInsets.fromLTRB(16, 8, 16, 24),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(color: Brand.green, borderRadius: BorderRadius.circular(8)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(s.sellBandTitle, style: const TextStyle(color: Brand.paper, fontSize: 19, fontWeight: FontWeight.w700, height: 1.4)),
              const SizedBox(height: 12),
              FilledButton(
                style: FilledButton.styleFrom(backgroundColor: Brand.paper, foregroundColor: Brand.green),
                onPressed: onSell,
                child: Text(s.sellBandCta),
              ),
            ]),
          ),
        ],
      ),
    );
  }
}

class ErrorRetry extends ConsumerWidget {
  const ErrorRetry({super.key, required this.onRetry});
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(children: [
        Text(s.loadError, textAlign: TextAlign.center),
        const SizedBox(height: 12),
        OutlinedButton(onPressed: onRetry, child: Text(s.retry)),
      ]),
    );
  }
}
