import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:material_ui/material_ui.dart';

import '../data/catalog.dart';
import '../data/format.dart';
import '../data/models.dart';
import '../state.dart';
import '../theme.dart';
import 'widgets.dart';

const maxPhotos = 20;

/// Sell tab: login → become owner → post form.
class SellTab extends ConsumerWidget {
  const SellTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final user = ref.watch(authProvider).value;

    Widget center(List<Widget> children) => ListView(padding: const EdgeInsets.all(24), children: [
          Text(s.sellTitle, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 12),
          ...children,
        ]);

    if (user == null) {
      return center([
        Text(s.sellLoginFirst, style: const TextStyle(color: Brand.inkSoft)),
        const SizedBox(height: 16),
        FilledButton(key: const Key('sell-login'), onPressed: () => context.push('/login'), child: Text(s.login)),
      ]);
    }
    if (user.role == 'agent') return center([Text(s.agentsCannotPost)]);
    if (!user.canPost) {
      return center([
        Text(s.becomeOwnerTitle, style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 6),
        Text(s.becomeOwnerBody, style: const TextStyle(color: Brand.inkSoft)),
        const SizedBox(height: 16),
        FilledButton(
          key: const Key('become-owner'),
          onPressed: () async {
            try {
              await ref.read(repositoryProvider).becomeOwner();
              ref.invalidate(authProvider);
            } catch (_) {
              if (context.mounted) showSnack(context, s.submitError);
            }
          },
          child: Text(s.becomeOwner),
        ),
      ]);
    }
    return const ListingForm();
  }
}

class ListingForm extends ConsumerStatefulWidget {
  const ListingForm({super.key});

  @override
  ConsumerState<ListingForm> createState() => _ListingFormState();
}

class _ListingFormState extends ConsumerState<ListingForm> {
  final _draft = ListingDraft();
  final _photos = <Uint8List>[];
  final _title = TextEditingController();
  final _desc = TextEditingController();
  final _price = TextEditingController();
  final _area = TextEditingController();
  final _village = TextEditingController();
  final _mandalText = TextEditingController();
  final _ownerName = TextEditingController();
  final _ownerPhone = TextEditingController();
  final _picker = ImagePicker();
  String? _error;
  String? _progress;
  bool _busy = false;

  @override
  void dispose() {
    for (final c in [_title, _desc, _price, _area, _village, _mandalText, _ownerName, _ownerPhone]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _addPhotos(ImageSource source) async {
    final room = maxPhotos - _photos.length;
    if (room <= 0) return;
    // image_picker resizes and compresses on the phone before upload.
    final files = source == ImageSource.camera
        ? [await _picker.pickImage(source: source, maxWidth: 1600, maxHeight: 1600, imageQuality: 80)].whereType<XFile>().toList()
        : await _picker.pickMultiImage(maxWidth: 1600, maxHeight: 1600, imageQuality: 80, limit: room);
    for (final f in files.take(room)) {
      final bytes = await f.readAsBytes();
      if (bytes.lengthInBytes < 5 * 1024 * 1024) _photos.add(bytes);
    }
    setState(() {});
  }

  Future<void> _useGps() async {
    final s = ref.read(stringsProvider);
    try {
      if (!await Geolocator.isLocationServiceEnabled()) throw Exception('off');
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) throw Exception('denied');
      final pos = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.high));
      setState(() {
        _draft.lat = pos.latitude;
        _draft.lng = pos.longitude;
      });
    } catch (_) {
      if (mounted) showSnack(context, s.gpsOff);
    }
  }

  Future<void> _submit() async {
    final s = ref.read(stringsProvider);
    final price = num.tryParse(_price.text.replaceAll(',', '').trim());
    final area = num.tryParse(_area.text.replaceAll(',', '').trim());
    String? err;
    if (_photos.isEmpty) {
      err = s.needPhoto;
    } else if (_title.text.trim().isEmpty) {
      err = s.needTitle;
    } else if (price == null || price <= 0) {
      err = s.needPrice;
    } else if (area == null || area <= 0) {
      err = s.needArea;
    } else if (_ownerPhone.text.isNotEmpty && !isMobile(normalizeMobile(_ownerPhone.text))) {
      err = s.invalidPhone;
    }
    setState(() => _error = err);
    if (err != null) return;

    _draft
      ..title = _title.text.trim()
      ..description = _desc.text.trim()
      ..price = price
      ..area = area
      ..village = _village.text.trim()
      ..ownerName = _ownerName.text.trim()
      ..ownerPhone = _ownerPhone.text.isEmpty ? '' : normalizeMobile(_ownerPhone.text);
    if ((mandals[_draft.district] ?? const []).isEmpty) _draft.mandal = _mandalText.text.trim();

    setState(() => _busy = true);
    try {
      await ref.read(repositoryProvider).submitListing(_draft, List.of(_photos), onProgress: (d, t) {
        if (mounted) setState(() => _progress = s.uploading(d, t));
      });
      ref.invalidate(myListingsProvider);
      if (!mounted) return;
      showSnack(context, s.submitted);
      setState(() {
        _photos.clear();
        for (final c in [_title, _desc, _price, _area, _village, _mandalText, _ownerName, _ownerPhone]) {
          c.clear();
        }
        _progress = null;
      });
    } catch (_) {
      setState(() => _error = s.submitError);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final te = s.te;
    final mandalList = mandals[_draft.district] ?? const <Named>[];

    InputDecoration dec(String label) => InputDecoration(labelText: label);
    const gap = SizedBox(height: 14);

    return ListView(padding: const EdgeInsets.fromLTRB(16, 16, 16, 32), children: [
      Text(s.sellTitle, style: Theme.of(context).textTheme.headlineSmall),
      const SizedBox(height: 16),

      // Photos
      Text(s.photos, style: Theme.of(context).textTheme.titleMedium),
      Text(s.photosHint(_photos.length), style: const TextStyle(color: Brand.inkSoft, fontSize: 13)),
      const SizedBox(height: 8),
      SizedBox(
        height: 92,
        child: ListView(scrollDirection: Axis.horizontal, children: [
          for (var i = 0; i < _photos.length; i++)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: Stack(children: [
                ClipRRect(borderRadius: BorderRadius.circular(6), child: Image.memory(_photos[i], width: 92, height: 92, fit: BoxFit.cover)),
                Positioned(
                  right: 0,
                  top: 0,
                  child: IconButton(
                    visualDensity: VisualDensity.compact,
                    style: IconButton.styleFrom(backgroundColor: Brand.paper),
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () => setState(() => _photos.removeAt(i)),
                  ),
                ),
              ]),
            ),
        ]),
      ),
      const SizedBox(height: 8),
      Row(children: [
        Expanded(child: OutlinedButton.icon(onPressed: () => _addPhotos(ImageSource.camera), icon: const Icon(Icons.photo_camera), label: Text(s.camera))),
        const SizedBox(width: 10),
        Expanded(child: OutlinedButton.icon(onPressed: () => _addPhotos(ImageSource.gallery), icon: const Icon(Icons.photo_library), label: Text(s.gallery))),
      ]),
      const SizedBox(height: 20),

      SegmentedButton<String>(
        segments: [ButtonSegment(value: 'sale', label: Text(s.forSale)), ButtonSegment(value: 'rent', label: Text(s.forRent))],
        selected: {_draft.purpose},
        onSelectionChanged: (v) => setState(() {
          _draft.purpose = v.first;
          if (_draft.purpose == 'rent') _draft.priceBasis = 'per-month';
        }),
      ),
      gap,
      DropdownButtonFormField<String>(
        initialValue: _draft.category,
        isExpanded: true,
        decoration: dec(s.type),
        items: [for (final c in categories) DropdownMenuItem(value: c.id, child: Text(c.label(te)))],
        onChanged: (v) => setState(() => _draft.category = v ?? _draft.category),
      ),
      gap,
      TextField(key: const Key('sell-title'), controller: _title, decoration: dec(s.titleLabel), maxLength: 120),
      TextField(controller: _desc, decoration: dec(s.descriptionLabel), maxLines: 4, maxLength: 4000),
      gap,
      Row(children: [
        Expanded(child: TextField(key: const Key('sell-price'), controller: _price, keyboardType: TextInputType.number, decoration: dec(s.price))),
        const SizedBox(width: 10),
        Expanded(
          child: DropdownButtonFormField<String>(
            initialValue: _draft.priceBasis,
            isExpanded: true,
            decoration: dec(s.priceBasis),
            items: [
              DropdownMenuItem(value: 'total', child: Text(s.basisTotal)),
              DropdownMenuItem(value: 'per-unit', child: Text(s.basisPerUnit)),
              DropdownMenuItem(value: 'per-month', child: Text(s.basisPerMonth)),
            ],
            onChanged: (v) => setState(() => _draft.priceBasis = v ?? 'total'),
          ),
        ),
      ]),
      gap,
      Row(children: [
        Expanded(child: TextField(key: const Key('sell-area'), controller: _area, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: dec(s.areaValue))),
        const SizedBox(width: 10),
        Expanded(
          child: DropdownButtonFormField<String>(
            initialValue: _draft.areaUnit,
            isExpanded: true,
            decoration: dec(s.unit),
            items: [for (final u in areaUnits) DropdownMenuItem(value: u.id, child: Text(u.label(te)))],
            onChanged: (v) => setState(() => _draft.areaUnit = v ?? 'acre'),
          ),
        ),
      ]),
      gap,
      DropdownButtonFormField<String>(
        initialValue: _draft.district,
        isExpanded: true,
        decoration: dec(s.district),
        items: [for (final d in districts) DropdownMenuItem(value: d.id, child: Text(d.label(te)))],
        onChanged: (v) => setState(() {
          _draft.district = v ?? _draft.district;
          final list = mandals[_draft.district] ?? const <Named>[];
          _draft.mandal = list.isEmpty ? '' : list.first.id;
        }),
      ),
      gap,
      if (mandalList.isNotEmpty)
        DropdownButtonFormField<String>(
          key: ValueKey('sell-mandal-${_draft.district}'),
          initialValue: mandalList.any((m) => m.id == _draft.mandal) ? _draft.mandal : mandalList.first.id,
          isExpanded: true,
          decoration: dec(s.mandal),
          items: [for (final m in mandalList) DropdownMenuItem(value: m.id, child: Text(m.label(te)))],
          onChanged: (v) => setState(() => _draft.mandal = v ?? _draft.mandal),
        )
      else
        TextField(controller: _mandalText, decoration: dec(s.mandalText), maxLength: 60),
      gap,
      TextField(controller: _village, decoration: dec(s.village), maxLength: 80),
      OutlinedButton.icon(
        onPressed: _useGps,
        icon: Icon(_draft.lat == null ? Icons.my_location : Icons.check_circle, color: _draft.lat == null ? null : Brand.green),
        label: Text(_draft.lat == null ? s.gps : s.gpsSet(_draft.lat!, _draft.lng!), textAlign: TextAlign.center),
      ),
      const SizedBox(height: 20),
      TextField(controller: _ownerName, decoration: dec(s.ownerName), maxLength: 80),
      TextField(controller: _ownerPhone, keyboardType: TextInputType.phone, decoration: dec(s.ownerPhone).copyWith(prefixText: '+91 ')),
      const SizedBox(height: 20),
      if (_error != null)
        Padding(padding: const EdgeInsets.only(bottom: 10), child: Text(_error!, key: const Key('sell-error'), style: const TextStyle(color: Colors.red))),
      if (_progress != null) Padding(padding: const EdgeInsets.only(bottom: 10), child: Text(_progress!)),
      FilledButton(key: const Key('sell-submit'), onPressed: _busy ? null : _submit, child: Text(_busy ? s.sending : s.submit)),
    ]);
  }
}
