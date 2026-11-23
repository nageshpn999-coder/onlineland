import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../data/catalog.dart';
import '../data/format.dart';
import '../data/models.dart';
import '../state.dart';
import '../theme.dart';
import 'plan.dart';
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
      if (user != null) ...[
        const SizedBox(height: 16),
        Card(
          child: Column(children: [
            ListTile(
              key: const Key('open-plan'),
              leading: const Icon(Icons.workspace_premium, color: Brand.green),
              title: Text(s.myPlan),
              subtitle: _PlanSummary(),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => context.push('/plan'),
            ),
            if (user.canPost)
              ListTile(
                key: const Key('open-leads'),
                leading: const Icon(Icons.inbox, color: Brand.blue),
                title: Text(s.myLeads),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => context.push('/leads'),
              ),
          ]),
        ),
      ],
      const SizedBox(height: 16),
      Card(
        child: ListTile(
          key: const Key('open-services'),
          leading: const Icon(Icons.handyman, color: Brand.green),
          title: Text(s.services),
          subtitle: Text(s.servicesLead),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => context.push('/services'),
        ),
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
      const SizedBox(height: 16),
      Wrap(spacing: 4, children: [
        TextButton(
          onPressed: () => launchUrl(Uri.parse('https://onlineland.in/$locale/legal/privacy'), mode: LaunchMode.externalApplication),
          child: Text(s.privacyPolicy),
        ),
        TextButton(
          onPressed: () => launchUrl(Uri.parse('https://onlineland.in/$locale/legal/terms'), mode: LaunchMode.externalApplication),
          child: Text(s.termsOfUse),
        ),
      ]),
      if (user != null && user.role != 'admin')
        TextButton(
          key: const Key('delete-account'),
          style: TextButton.styleFrom(foregroundColor: Colors.red.shade700),
          onPressed: () => _confirmDelete(context, ref),
          child: Text(s.deleteAccount),
        ),
    ]);
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final s = ref.read(stringsProvider);
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(s.deleteAccountTitle),
        content: Text(s.deleteAccountBody),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text(s.cancel)),
          FilledButton(
            key: const Key('delete-confirm'),
            style: FilledButton.styleFrom(backgroundColor: Colors.red.shade700),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(s.deleteConfirm),
          ),
        ],
      ),
    );
    if (ok != true) return;
    try {
      await ref.read(repositoryProvider).deleteAccount();
      refreshRevenue(ref);
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.accountDeleted)));
    } catch (_) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.submitError)));
    }
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

class _PlanSummary extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final d = ref.watch(myDealerProvider).value;
    final plans = ref.watch(revenueConfigProvider).value?.plans ?? defaultPlans;
    if (d == null || !d.active(DateTime.now())) return Text(s.freePlanNow);
    return Text('${plans[d.planId]?.name(s.te) ?? d.planId} · ${s.validTill(shortDate(d.validUntil!))}');
  }
}

class _MyListingTile extends ConsumerWidget {
  const _MyListingTile({required this.property});
  final Property property;

  Future<void> _feature(BuildContext context, WidgetRef ref) async {
    final s = ref.read(stringsProvider);
    final dealer = ref.read(myDealerProvider).value;
    final config = await ref.read(revenueConfigProvider.future);
    if (!context.mounted) return;
    if (dealer != null && dealer.active(DateTime.now()) && dealer.slotsLeft > 0) {
      try {
        await ref.read(repositoryProvider).useFeaturedSlot(property.id);
        refreshRevenue(ref);
        if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.featuredDone)));
      } catch (_) {
        if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(s.submitError)));
      }
      return;
    }
    await showPaySheet(context, ref,
        kind: 'featured', propertyId: property.id, title: '${s.payKind('featured')} ${property.code ?? ''}'.trim(),
        amountInr: config.pricing.featuredWeekInr, pricing: config.pricing);
  }

  Future<void> _payListing(BuildContext context, WidgetRef ref) async {
    final s = ref.read(stringsProvider);
    final config = await ref.read(revenueConfigProvider.future);
    if (!context.mounted) return;
    await showPaySheet(context, ref,
        kind: 'listing', propertyId: property.id, title: s.payKind('listing'), amountInr: config.pricing.ownerListingInr, pricing: config.pricing);
  }

  Future<void> _chooseSale(BuildContext context, WidgetRef ref) async {
    final s = ref.read(stringsProvider);
    final mode = await showDialog<String>(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: Text(s.saleModeQ),
        children: [
          SimpleDialogOption(key: const Key('sale-choose-self'), onPressed: () => Navigator.pop(ctx, 'self'), child: Text(s.saleSelf)),
          SimpleDialogOption(key: const Key('sale-choose-assisted'), onPressed: () => Navigator.pop(ctx, 'assisted'), child: Text(s.saleAssisted)),
        ],
      ),
    );
    if (mode == null || mode == property.saleMode) return;
    try {
      await ref.read(repositoryProvider).setSaleMode(property.id, mode);
      ref.invalidate(myListingsProvider);
    } catch (_) {
      if (context.mounted) showSnack(context, s.submitError);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final p = property;
    final user = ref.watch(authProvider).value;
    final dealer = ref.watch(myDealerProvider).value;
    final mine = ref.watch(myListingsProvider).value ?? const <Property>[];
    final pricing = ref.watch(revenueConfigProvider).value?.pricing ?? const Pricing();
    final live = p.status == 'approved' && p.code != null;
    final planActive = dealer != null && dealer.active(DateTime.now());
    // An owner without a plan who already has their free listing(s) live pays for the next one.
    final liveCount = mine.where((m) => m.status == 'approved').length;
    final needsPayment = p.status == 'pending' && user?.role == 'owner' && !planActive && liveCount >= pricing.ownerFreeListings;
    final stats = live ? ref.watch(listingStatsProvider(p.id)).value : null;
    final canChooseSale = user?.role == 'owner' && (p.status == 'approved' || p.status == 'pending');
    final color = switch (p.status) {
      'approved' => Brand.green,
      'rejected' => Colors.red.shade700,
      _ => const Color(0xFF8A4B08),
    };
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Column(children: [
        ListTile(
          key: Key('my-listing-${p.id}'),
          leading: Icon(categoryIcon(p.category), color: Brand.blue),
          title: Text(p.title(s.te), style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${byId(categories, p.category)?.label(s.te) ?? ''} · ${formatPrice(p.total, s.te)}'),
            Text('${s.statusName(p.status)}${p.isFeatured ? ' · ★' : ''}', style: TextStyle(color: color, fontWeight: FontWeight.w700)),
            if (p.status == 'rejected' && p.rejectReason != null) Text(s.rejectReason(p.rejectReason!)),
            if (stats != null) Text(s.stats(stats.views, stats.shares, stats.leads), key: Key('stats-${p.id}'), style: const TextStyle(color: Brand.inkSoft)),
            if (needsPayment) Text(s.payListingNote(pricing.ownerFreeListings), style: const TextStyle(color: Brand.inkSoft)),
            if (p.saleMode != null)
              Text(p.saleMode == 'assisted' ? s.saleAssisted : s.saleSelf, key: Key('sale-mode-label-${p.id}'), style: const TextStyle(color: Brand.blue)),
          ]),
          isThreeLine: true,
          onTap: live ? () => context.push('/property/${p.code}') : null,
        ),
        if (live || needsPayment || canChooseSale)
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 0, 12, 10),
            child: Wrap(spacing: 8, runSpacing: 4, children: [
              if (live)
                OutlinedButton.icon(
                  key: Key('share-${p.id}'),
                  onPressed: () {
                    ref.read(repositoryProvider).track(p.id, 'share');
                    shareOnWhatsApp(
                      s.shareText(p.title(s.te), formatPrice(p.total, s.te), p.code!),
                      shareLink(p.code!, ref.read(localeProvider), refId: user?.uid),
                    );
                  },
                  icon: const Icon(Icons.share, size: 18),
                  label: Text(s.share),
                ),
              if (live && !p.isFeatured)
                OutlinedButton.icon(
                  key: Key('feature-${p.id}'),
                  onPressed: () => _feature(context, ref),
                  icon: const Icon(Icons.star_outline, size: 18),
                  label: Text(planActive && dealer.slotsLeft > 0 ? s.featureFree(dealer.slotsLeft) : '${s.feature} · ₹${pricing.featuredWeekInr}'),
                ),
              if (canChooseSale)
                TextButton.icon(
                  key: Key('sale-mode-${p.id}'),
                  onPressed: () => _chooseSale(context, ref),
                  icon: const Icon(Icons.handshake_outlined, size: 18),
                  label: Text(s.changeSaleMode),
                ),
              if (needsPayment)
                FilledButton(
                  key: Key('pay-listing-${p.id}'),
                  onPressed: () => _payListing(context, ref),
                  child: Text('${s.payListing} · ₹${pricing.ownerListingInr}'),
                ),
            ]),
          ),
      ]),
    );
  }
}
