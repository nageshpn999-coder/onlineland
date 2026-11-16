import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../data/format.dart';
import '../state.dart';
import '../theme.dart';

class FavoritesTab extends ConsumerWidget {
  const FavoritesTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final items = ref.watch(favoritesProvider);

    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Padding(padding: const EdgeInsets.fromLTRB(16, 16, 16, 8), child: Text(s.savedTitle, style: Theme.of(context).textTheme.titleLarge)),
      Expanded(
        child: items.isEmpty
            ? Padding(
                padding: const EdgeInsets.all(32),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.favorite_border, size: 52, color: Brand.inkSoft),
                  const SizedBox(height: 12),
                  Text(s.savedEmptyTitle, textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 6),
                  Text(s.savedEmptyBody, textAlign: TextAlign.center, style: const TextStyle(color: Brand.inkSoft)),
                ]),
              )
            : ListView.separated(
                key: const Key('favorites-list'),
                itemCount: items.length,
                separatorBuilder: (_, _) => const Divider(),
                itemBuilder: (_, i) {
                  final f = items[i];
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    title: Text(f.title(s.te), style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('${f.code} · ${formatPrice(f.total, s.te)}'),
                    onTap: () => context.push('/property/${f.code}'),
                    trailing: TextButton(onPressed: () => ref.read(favoritesProvider.notifier).remove(f.id), child: Text(s.remove)),
                  );
                },
              ),
      ),
    ]);
  }
}
