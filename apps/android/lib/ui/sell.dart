import 'dart:typed_data';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:material_ui/material_ui.dart';

import '../data/catalog.dart';
import '../data/format.dart';
import '../data/media.dart';
import '../data/models.dart';
import '../l10n.dart';
import '../state.dart';
import '../theme.dart';
import 'services.dart';
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
  final _youtube = TextEditingController();
  PreparedVideo? _video;
  String? _videoStatus; // compressing… %
  String? _youtubeError;
  String? _error;
  String? _progress;
  bool _busy = false;

  @override
  void dispose() {
    for (final c in [_title, _desc, _price, _area, _village, _mandalText, _ownerName, _ownerPhone, _youtube]) {
      c.dispose();
    }
    if (_videoStatus != null) ref.read(videoToolsProvider).cancel();
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

  /// Record or choose a video, then compress it on the phone (720p) before anything is uploaded.
  Future<void> _addVideo({required bool camera}) async {
    final s = ref.read(stringsProvider);
    final tools = ref.read(videoToolsProvider);
    final path = await tools.pick(camera: camera);
    if (path == null || !mounted) return;
    setState(() => _videoStatus = s.compressing(0));
    try {
      final v = await tools.compress(path, onProgress: (p) {
        if (mounted) setState(() => _videoStatus = s.compressing(p.clamp(0, 100).round()));
      });
      if (v.bytes > videoMaxBytes) throw StateError('too big');
      setState(() {
        _video = v;
        _youtube.clear();
        _youtubeError = null;
      });
    } on VideoTooLong catch (e) {
      if (mounted) showSnack(context, s.videoTooLong(e.seconds));
    } catch (_) {
      if (mounted) showSnack(context, s.videoFailed);
    } finally {
      if (mounted) setState(() => _videoStatus = null);
    }
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
    } else if (_asksSaleMode && _draft.saleMode == null) {
      err = s.needSaleMode;
    }
    final ytText = _youtube.text.trim();
    final ytId = ytText.isEmpty ? null : parseYouTubeId(ytText);
    _youtubeError = ytText.isNotEmpty && ytId == null ? s.youtubeInvalid : null;
    err ??= _youtubeError;
    if (err == null && _videoStatus != null) return; // still compressing
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
      final VideoAttachment? video = _video ?? (ytId != null ? YouTubeAttachment(ytId) : null);
      final id = await ref.read(repositoryProvider).submitListing(_draft, List.of(_photos), video: video, onProgress: (d, t) {
        if (mounted) setState(() => _progress = d == t && _video != null ? s.uploadingVideo : s.uploading(d, t));
      });
      ref.invalidate(myListingsProvider);
      if (!mounted) return;
      final hadVideo = video != null;
      setState(() {
        _photos.clear();
        _video = null;
        _draft.saleMode = null;
        for (final c in [_title, _desc, _price, _area, _village, _mandalText, _ownerName, _ownerPhone, _youtube]) {
          c.clear();
        }
        _progress = null;
      });
      await showSubmittedSheet(context, ref, propertyId: id, suggestDrone: !hadVideo);
    } catch (_) {
      setState(() => _error = s.submitError);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Only owners are asked how they want to sell (dealers sell for a living).
  bool get _asksSaleMode => ref.read(authProvider).value?.role == 'owner';

  Widget _saleModeQuestion(S s) {
    final pricing = ref.watch(revenueConfigProvider).value?.pricing ?? const Pricing();
    final pct = pricing.dealCommissionPct;
    final pctText = pct == pct.roundToDouble() ? pct.toStringAsFixed(0) : pct.toString();
    final example = s.te
        ? '₹20 లక్షలకు ₹${groupIndian((2000000 * pct / 100).round())}'
        : '₹${groupIndian((2000000 * pct / 100).round())} on ₹20 lakh';
    Widget option(String mode, String title, String body, IconData icon) {
      final on = _draft.saleMode == mode;
      return Card(
        key: Key('sale-$mode'),
        margin: const EdgeInsets.only(bottom: 8),
        color: on ? Brand.greenSoft : null,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: BorderSide(color: on ? Brand.green : Brand.line, width: on ? 2 : 1),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: () => setState(() {
            _draft.saleMode = mode;
            if (_error == s.needSaleMode) _error = null;
          }),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Icon(on ? Icons.radio_button_checked : Icons.radio_button_unchecked, color: on ? Brand.green : Brand.inkSoft),
              const SizedBox(width: 10),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Icon(icon, size: 18, color: Brand.blue),
                    const SizedBox(width: 6),
                    Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.w700))),
                  ]),
                  const SizedBox(height: 2),
                  Text(body, style: const TextStyle(color: Brand.inkSoft, fontSize: 13)),
                ]),
              ),
            ]),
          ),
        ),
      );
    }

    return Column(key: const Key('sale-mode'), crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Row(children: [
        Expanded(child: Text(s.saleModeQ, style: Theme.of(context).textTheme.titleMedium)),
        IconButton(
          key: const Key('sale-help'),
          tooltip: s.saleModeHelpTitle,
          icon: const Icon(Icons.help_outline),
          onPressed: () => showDialog<void>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: Text(s.saleModeHelpTitle),
              content: SingleChildScrollView(child: Text(s.saleModeHelp)),
              actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: Text(s.close))],
            ),
          ),
        ),
      ]),
      const SizedBox(height: 4),
      option('self', s.saleSelf, s.saleSelfBody, Icons.person_outline),
      option('assisted', s.saleAssisted, s.saleAssistedBody(pctText, example), Icons.handshake_outlined),
      const SizedBox(height: 12),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final s = ref.watch(stringsProvider);
    final te = s.te;
    final isOwner = ref.watch(authProvider).value?.role == 'owner';
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

      // Video (optional): compressed on the phone, or a YouTube link
      Text(s.videoOptional, style: Theme.of(context).textTheme.titleMedium),
      Text(s.videoHint, style: const TextStyle(color: Brand.inkSoft, fontSize: 13)),
      const SizedBox(height: 8),
      if (_videoStatus != null)
        Row(key: const Key('video-compressing'), children: [
          const SizedBox.square(dimension: 18, child: CircularProgressIndicator(strokeWidth: 2)),
          const SizedBox(width: 10),
          Expanded(child: Text(_videoStatus!)),
        ])
      else if (_video != null)
        Card(
          key: const Key('video-ready'),
          child: ListTile(
            leading: _video!.poster != null
                ? ClipRRect(borderRadius: BorderRadius.circular(4), child: Image.memory(_video!.poster!, width: 64, height: 48, fit: BoxFit.cover))
                : const Icon(Icons.movie, color: Brand.blue),
            title: Text(s.videoReady(mmss(_video!.durationSec), (_video!.bytes / (1024 * 1024)).toStringAsFixed(1))),
            trailing: IconButton(
              key: const Key('video-remove'),
              tooltip: s.removeVideo,
              icon: const Icon(Icons.close),
              onPressed: () => setState(() => _video = null),
            ),
          ),
        )
      else ...[
        Row(children: [
          Expanded(child: OutlinedButton.icon(key: const Key('video-record'), onPressed: () => _addVideo(camera: true), icon: const Icon(Icons.videocam), label: Text(s.recordVideo))),
          const SizedBox(width: 10),
          Expanded(child: OutlinedButton.icon(key: const Key('video-pick'), onPressed: () => _addVideo(camera: false), icon: const Icon(Icons.video_library), label: Text(s.pickVideo))),
        ]),
        const SizedBox(height: 10),
        TextField(
          key: const Key('youtube-link'),
          controller: _youtube,
          keyboardType: TextInputType.url,
          decoration: InputDecoration(labelText: s.youtubeLink, hintText: 'https://youtu.be/…', errorText: _youtubeError, prefixIcon: const Icon(Icons.smart_display)),
          onChanged: (_) {
            if (_youtubeError != null) setState(() => _youtubeError = null);
          },
        ),
      ],
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
      if (isOwner) _saleModeQuestion(s),
      if (_error != null)
        Padding(padding: const EdgeInsets.only(bottom: 10), child: Text(_error!, key: const Key('sell-error'), style: const TextStyle(color: Colors.red))),
      if (_progress != null) Padding(padding: const EdgeInsets.only(bottom: 10), child: Text(_progress!)),
      FilledButton(key: const Key('sell-submit'), onPressed: _busy ? null : _submit, child: Text(_busy ? s.sending : s.submit)),
    ]);
  }
}

/// After a listing is sent: what happens next, and (when it has no video) one optional suggestion — a drone video.
Future<void> showSubmittedSheet(BuildContext context, WidgetRef ref, {required String propertyId, required bool suggestDrone}) {
  final s = ref.read(stringsProvider);
  final drone = (ref.read(revenueConfigProvider).value ?? const RevenueConfig()).services['drone'];
  final offerDrone = suggestDrone && (drone?.active ?? false);
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (ctx) => Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      child: Column(key: const Key('submitted-sheet'), mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(s.submittedTitle, style: Theme.of(ctx).textTheme.titleLarge),
        const SizedBox(height: 4),
        Text(s.submittedBody, style: const TextStyle(color: Brand.inkSoft)),
        if (offerDrone) ...[
          const SizedBox(height: 16),
          Card(
            color: Brand.greenSoft,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                Text(s.droneTip, style: const TextStyle(fontWeight: FontWeight.w700)),
                if (drone!.priceInr != null && drone.priceInr! > 0) Text('₹${groupIndian(drone.priceInr!)}', style: const TextStyle(color: Brand.green)),
                const SizedBox(height: 8),
                Wrap(alignment: WrapAlignment.end, spacing: 8, children: [
                  TextButton(key: const Key('drone-no'), onPressed: () => Navigator.pop(ctx), child: Text(s.noThanks)),
                  FilledButton(
                    key: const Key('drone-yes'),
                    onPressed: () {
                      Navigator.pop(ctx);
                      showServiceRequestSheet(context, ref, serviceId: 'drone', propertyId: propertyId);
                    },
                    child: Text(s.droneYes),
                  ),
                ]),
              ]),
            ),
          ),
        ] else ...[
          const SizedBox(height: 12),
          FilledButton(onPressed: () => Navigator.pop(ctx), child: Text(s.close)),
        ],
      ]),
    ),
  );
}
