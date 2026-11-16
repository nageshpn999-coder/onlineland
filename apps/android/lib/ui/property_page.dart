import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../data/catalog.dart';
import '../data/format.dart';
import '../data/models.dart';
import '../state.dart';
import '../theme.dart';
import 'forms.dart';
import 'widgets.dart';

class PropertyPage extends ConsumerWidget {
  const PropertyPage({super.key, required this.code});
  final String code;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final async = ref.watch(propertyByCodeProvider(code));
    return async.when(
      loading: () => Scaffold(appBar: AppBar(), body: const Center(child: CircularProgressIndicator())),
      error: (_, _) => Scaffold(
        appBar: AppBar(),
        body: Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(s.loadError, textAlign: TextAlign.center))),
      ),
      data: (p) => p == null
          ? Scaffold(appBar: AppBar(), body: Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(s.notFound, textAlign: TextAlign.center))))
          : _PropertyView(property: p),
    );
  }
}

class _PropertyView extends ConsumerWidget {
  const _PropertyView({required this.property});
  final Property property;

  void _logClick(WidgetRef ref, String channel) {
    ref.read(repositoryProvider).createLead(propertyId: property.id, channel: channel, locale: ref.read(localeProvider)).catchError((_) {});
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final te = s.te;
    final p = property;
    final saved = ref.watch(favoritesProvider).any((f) => f.id == p.id);
    final cat = byId(categories, p.category);
    final title = p.title(te);

    final facts = <(String, String)>[
      (s.code, p.code ?? ''),
      (s.category, '${cat?.label(te) ?? p.category}, ${p.purpose == 'rent' ? s.forRent : s.forSale}'),
      (s.area, formatArea(p.area, p.areaUnit, te)),
      (s.location, p.place.label(te)),
      if (p.facing != null) (s.facing, s.facingName(p.facing!)),
      if (p.roadAccess != null) (s.road, p.roadAccess! ? s.yes : s.no),
      if (p.waterSource != null) (s.water, p.waterSource!),
      if (p.docsVerified) (s.docs, s.docsVerified),
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(p.code ?? ''),
        actions: [
          IconButton(
            key: const Key('share-property'),
            tooltip: s.share,
            icon: const Icon(Icons.share),
            onPressed: () {
              final user = ref.read(authProvider).value;
              final own = user != null && user.uid == p.ownerId;
              ref.read(repositoryProvider).track(p.id, 'share');
              shareOnWhatsApp(
                s.shareText(title, formatPrice(p.total, te), p.code ?? ''),
                shareLink(p.code ?? '', ref.read(localeProvider), refId: own ? user.uid : null),
              );
            },
          ),
          IconButton(
            key: const Key('favorite-toggle'),
            tooltip: saved ? s.saved : s.save,
            icon: Icon(saved ? Icons.favorite : Icons.favorite_border, color: saved ? Brand.green : null),
            onPressed: () => ref.read(favoritesProvider.notifier).toggle(p),
          ),
        ],
      ),
      body: ListView(padding: const EdgeInsets.only(bottom: 24), children: [
        _TrackView(propertyId: p.id),
        _Gallery(property: p),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 4),
            Text(p.place.label(te), style: const TextStyle(color: Brand.inkSoft)),
            const SizedBox(height: 12),
            PriceBlock(property: p, large: true),
            const SizedBox(height: 20),
            Text(s.details, style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(border: Border.all(color: Brand.line), borderRadius: BorderRadius.circular(8)),
              child: Column(children: [
                for (var i = 0; i < facts.length; i++) ...[
                  if (i > 0) const Divider(),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      SizedBox(width: 120, child: Text(facts[i].$1, style: const TextStyle(color: Brand.inkSoft))),
                      Expanded(child: Text(facts[i].$2, style: const TextStyle(fontWeight: FontWeight.w600))),
                    ]),
                  ),
                ],
              ]),
            ),
            if (p.description(te).isNotEmpty) ...[
              const SizedBox(height: 20),
              Text(s.about, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 6),
              Text(p.description(te)),
            ],
            if (p.place.lat != null && p.place.lng != null) ...[
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => openMap(p.place.lat!, p.place.lng!),
                icon: const Icon(Icons.map_outlined),
                label: Text(s.openMap),
              ),
            ],
            const SizedBox(height: 20),
            OutlinedButton.icon(
              key: const Key('open-enquiry'),
              onPressed: () => showFormSheet(context, EnquiryForm(propertyId: p.id)),
              icon: const Icon(Icons.edit_note),
              label: Text(s.askDetails),
            ),
            const SizedBox(height: 10),
            OutlinedButton.icon(
              key: const Key('open-visit'),
              onPressed: () => showFormSheet(context, SiteVisitForm(propertyId: p.id)),
              icon: const Icon(Icons.event_available),
              label: Text(s.bookVisit),
            ),
          ]),
        ),
      ]),
      bottomNavigationBar: SafeArea(
        child: Container(
          decoration: const BoxDecoration(color: Brand.paper, border: Border(top: BorderSide(color: Brand.line))),
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: Row(children: [
            Expanded(
              child: FilledButton.icon(
                key: const Key('whatsapp-button'),
                style: FilledButton.styleFrom(backgroundColor: Brand.green),
                onPressed: () {
                  _logClick(ref, 'whatsapp');
                  openWhatsApp(s.waMessage(p.code ?? '', title));
                },
                icon: const Icon(Icons.chat),
                label: Text(s.whatsapp),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  _logClick(ref, 'call');
                  callOnlineLand();
                },
                icon: const Icon(Icons.call),
                label: Text(s.call),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

class _Gallery extends ConsumerStatefulWidget {
  const _Gallery({required this.property});
  final Property property;

  @override
  ConsumerState<_Gallery> createState() => _GalleryState();
}

class _GalleryState extends ConsumerState<_Gallery> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final photos = widget.property.photos;
    if (photos.isEmpty || ref.watch(repositoryProvider).isDemo) {
      return AspectRatio(
        aspectRatio: 4 / 3,
        child: Stack(fit: StackFit.expand, children: [
          CategoryArt(category: widget.property.category, iconSize: 72),
          Positioned(
            left: 12,
            bottom: 12,
            child: Chip(label: Text(s.noPhotos)),
          ),
        ]),
      );
    }
    return AspectRatio(
      aspectRatio: 4 / 3,
      child: Stack(fit: StackFit.expand, children: [
        PageView.builder(
          itemCount: photos.length,
          onPageChanged: (i) => setState(() => _index = i),
          itemBuilder: (_, i) => Container(
            color: Brand.ink,
            child: PropertyPhoto(property: widget.property, path: photos[i], fit: BoxFit.contain),
          ),
        ),
        Positioned(
          right: 12,
          bottom: 12,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: Brand.ink.withValues(alpha: 0.75), borderRadius: BorderRadius.circular(20)),
            child: Text(s.photo(_index + 1, photos.length), style: const TextStyle(color: Brand.paper, fontSize: 13)),
          ),
        ),
      ]),
    );
  }
}

/// Counts one view for the owner's stats when the page opens.
class _TrackView extends ConsumerStatefulWidget {
  const _TrackView({required this.propertyId});
  final String propertyId;
  @override
  ConsumerState<_TrackView> createState() => _TrackViewState();
}

class _TrackViewState extends ConsumerState<_TrackView> {
  @override
  void initState() {
    super.initState();
    ref.read(repositoryProvider).track(widget.propertyId, 'view');
  }

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}
