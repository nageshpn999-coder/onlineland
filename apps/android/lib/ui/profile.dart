import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';

import '../data/catalog.dart';
import '../data/format.dart';
import '../data/models.dart';
import '../state.dart';
import '../theme.dart';
import 'widgets.dart';

class ProfileTab extends ConsumerWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final user = ref.watch(authProvider).value;
    final locale = ref.watch(localeProvider);

    return ListView(padding: const EdgeInsets.all(16), children: [
      Text(s.tabProfile, style: Theme.of(context).textTheme.headlineSmall),
      const SizedBox(height: 12),
      Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: user == null
              ? Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Text(s.loginWhy, style: const TextStyle(color: Brand.inkSoft)),
                  const SizedBox(height: 12),
                  FilledButton(key: const Key('profile-login'), onPressed: () => context.push('/login'), child: Text(s.login)),
                ])
              : Row(children: [
                  const CircleAvatar(backgroundColor: Brand.greenSoft, child: Icon(Icons.person, color: Brand.green)),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(user.phone ?? '', style: const TextStyle(fontWeight: FontWeight.w700)),
                      Text(s.role(user.role), style: const TextStyle(color: Brand.inkSoft)),
                    ]),
                  ),
                  TextButton(onPressed: () => ref.read(repositoryProvider).signOut(), child: Text(s.logout)),
                ]),
        ),
      ),
      const SizedBox(height: 16),
      Text(s.language, style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 8),
      SegmentedButton<String>(
        segments: const [ButtonSegment(value: 'te', label: Text('తెలుగు')), ButtonSegment(value: 'en', label: Text('English'))],
        selected: {locale},
        onSelectionChanged: (v) => ref.read(localeProvider.notifier).set(v.first),
      ),
      if (user != null && user.canPost) ...[
        const SizedBox(height: 22),
        Text(s.myListings, style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        const _MyListings(),
      ],
      const SizedBox(height: 22),
      Text(s.contactUs, style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 4),
      Text(s.office, style: const TextStyle(color: Brand.inkSoft)),
      const SizedBox(height: 10),
      Row(children: [
        Expanded(
          child: FilledButton.icon(
            style: FilledButton.styleFrom(backgroundColor: Brand.green),
            onPressed: () => openWhatsApp(),
            icon: const Icon(Icons.chat),
            label: Text(s.whatsapp),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(child: OutlinedButton.icon(onPressed: callOnlineLand, icon: const Icon(Icons.call), label: Text(s.call))),
      ]),
    ]);
  }
}

class _MyListings extends ConsumerWidget {
  const _MyListings();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    return ref.watch(myListingsProvider).when(
          loading: () => const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator())),
          error: (_, _) => Text(s.loadError),
          data: (list) => list.isEmpty
              ? Text(s.myListingsEmpty, style: const TextStyle(color: Brand.inkSoft))
              : Column(children: [for (final p in list) _MyListingTile(property: p)]),
        );
  }
}

class _MyListingTile extends ConsumerWidget {
  const _MyListingTile({required this.property});
  final Property property;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final p = property;
    final color = switch (p.status) {
      'approved' => Brand.green,
      'rejected' => Colors.red.shade700,
      _ => const Color(0xFF8A4B08),
    };
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        key: Key('my-listing-${p.id}'),
        leading: Icon(categoryIcon(p.category), color: Brand.blue),
        title: Text(p.title(s.te), style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${byId(categories, p.category)?.label(s.te) ?? ''} · ${formatPrice(p.total, s.te)}'),
          Text(s.statusName(p.status), style: TextStyle(color: color, fontWeight: FontWeight.w700)),
          if (p.status == 'rejected' && p.rejectReason != null) Text(s.rejectReason(p.rejectReason!)),
        ]),
        isThreeLine: true,
        onTap: p.status == 'approved' && p.code != null ? () => context.push('/property/${p.code}') : null,
      ),
    );
  }
}
