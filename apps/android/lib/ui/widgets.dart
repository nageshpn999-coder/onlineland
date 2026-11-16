import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../data/catalog.dart';
import '../data/format.dart';
import '../data/models.dart';
import '../state.dart';
import '../theme.dart';

IconData categoryIcon(String id) => switch (id) {
      'agricultural' => Icons.grass,
      'open-plot' => Icons.crop_square,
      'flat' => Icons.apartment,
      'apartment' => Icons.location_city,
      'villa' => Icons.villa,
      'luxury-home' => Icons.star_outline,
      'commercial' => Icons.storefront,
      'farmhouse' => Icons.cottage,
      'rental' => Icons.vpn_key_outlined,
      _ => Icons.home_outlined,
    };

/// Shown instead of a photo until the owner uploads one.
class CategoryArt extends StatelessWidget {
  const CategoryArt({super.key, required this.category, this.iconSize = 48});
  final String category;
  final double iconSize;

  @override
  Widget build(BuildContext context) {
    final land = category == 'agricultural' || category == 'open-plot' || category == 'farmhouse';
    return Container(
      color: land ? Brand.greenSoft : Brand.mist,
      alignment: Alignment.center,
      child: Icon(categoryIcon(category), size: iconSize, color: land ? Brand.green : Brand.blue),
    );
  }
}

class PropertyPhoto extends ConsumerWidget {
  const PropertyPhoto({super.key, required this.property, this.path, this.fit = BoxFit.cover});
  final Property property;
  final String? path;
  final BoxFit fit;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.watch(repositoryProvider);
    final p = path ?? property.coverPath;
    if (p == null || repo.isDemo) return CategoryArt(category: property.category);
    return CachedNetworkImage(
      imageUrl: repo.photoUrl(p),
      fit: fit,
      placeholder: (_, _) => Container(color: Brand.mist),
      errorWidget: (_, _, _) => CategoryArt(category: property.category),
    );
  }
}

class DemoBanner extends ConsumerWidget {
  const DemoBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!ref.watch(repositoryProvider).isDemo) return const SizedBox.shrink();
    return Container(
      width: double.infinity,
      color: const Color(0xFFFDF6EC),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Text(ref.watch(stringsProvider).demoBanner, style: const TextStyle(fontSize: 12.5, color: Color(0xFF8A4B08))),
    );
  }
}

class PropertyCard extends ConsumerWidget {
  const PropertyCard({super.key, required this.property});
  final Property property;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final te = s.te;
    final p = property;
    final saved = ref.watch(favoritesProvider).any((f) => f.id == p.id);
    final cat = byId(categories, p.category);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/property/${p.code}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 16 / 10,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  PropertyPhoto(property: p),
                  Positioned(
                    left: 10,
                    top: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: Brand.paper, borderRadius: BorderRadius.circular(20)),
                      child: Text(p.code ?? '', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Brand.ink)),
                    ),
                  ),
                  Positioned(
                    right: 6,
                    top: 6,
                    child: IconButton.filled(
                      style: IconButton.styleFrom(backgroundColor: Brand.paper, foregroundColor: saved ? Brand.green : Brand.inkSoft),
                      tooltip: saved ? s.saved : s.save,
                      icon: Icon(saved ? Icons.favorite : Icons.favorite_border),
                      onPressed: () => ref.read(favoritesProvider.notifier).toggle(p),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('${cat?.label(te) ?? p.category}, ${p.purpose == 'rent' ? s.forRent : s.forSale}',
                      style: const TextStyle(color: Brand.green, fontSize: 13, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(p.title(te), style: Theme.of(context).textTheme.titleMedium, maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 6),
                  _IconLine(icon: Icons.place_outlined, text: p.place.label(te)),
                  _IconLine(icon: Icons.square_foot, text: formatArea(p.area, p.areaUnit, te)),
                  const SizedBox(height: 8),
                  PriceBlock(property: p),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _IconLine extends StatelessWidget {
  const _IconLine({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 2),
        child: Row(children: [
          Icon(icon, size: 17, color: Brand.inkSoft),
          const SizedBox(width: 6),
          Expanded(child: Text(text, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Brand.inkSoft, fontSize: 14))),
        ]),
      );
}

class PriceBlock extends ConsumerWidget {
  const PriceBlock({super.key, required this.property, this.large = false});
  final Property property;
  final bool large;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final p = property;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text.rich(TextSpan(children: [
          TextSpan(text: formatPrice(p.total, s.te), style: TextStyle(fontSize: large ? 28 : 21, fontWeight: FontWeight.w800, color: Brand.ink)),
          if (p.priceBasis == 'per-month') TextSpan(text: '  ${s.perMonth}', style: const TextStyle(fontSize: 14, color: Brand.inkSoft)),
        ])),
        if (p.priceBasis == 'per-unit')
          Text('${formatPrice(p.price, s.te)} ${perUnit[p.areaUnit]?.label(s.te) ?? ''}', style: const TextStyle(color: Brand.inkSoft, fontSize: 13.5)),
      ],
    );
  }
}

// ---------- outside apps ----------

Uri whatsappUri([String? message]) =>
    Uri.parse('https://wa.me/${AppConfig.whatsapp}${message == null ? '' : '?text=${Uri.encodeComponent(message)}'}');

Future<void> openWhatsApp([String? message]) => launchUrl(whatsappUri(message), mode: LaunchMode.externalApplication);
Future<void> callOnlineLand() => launchUrl(Uri.parse('tel:+${AppConfig.whatsapp}'));
Future<void> openMap(double lat, double lng) =>
    launchUrl(Uri.parse('https://www.google.com/maps/search/?api=1&query=$lat,$lng'), mode: LaunchMode.externalApplication);

void showSnack(BuildContext context, String text) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(text)));
}
