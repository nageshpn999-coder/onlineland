import 'dart:io';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';

import '../data/media.dart';
import '../state.dart';
import '../theme.dart';

/// Listing video on the property page. Nothing downloads until the buyer taps play.
class ListingVideoTile extends ConsumerWidget {
  const ListingVideoTile({super.key, required this.video, required this.title});
  final ListingVideo video;
  final String title;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(stringsProvider);
    final repo = ref.watch(repositoryProvider);
    final (thumb, onTap, label) = switch (video) {
      YouTubeVideo v => (
          youTubeThumb(v.id),
          () => launchUrl(Uri.parse(youTubeWatch(v.id)), mode: LaunchMode.externalApplication),
          s.openYouTube,
        ),
      FileVideo v => (
          v.posterPath == null ? null : repo.photoUrl(v.posterPath!),
          () => Navigator.of(context).push(MaterialPageRoute<void>(
                builder: (_) => VideoScreen(source: v.path.startsWith('/') ? v.path : repo.photoUrl(v.path), title: title),
              )),
          '${s.playVideo}${v.durationSec != null ? ' · ${mmss(v.durationSec!)}' : ''}',
        ),
    };
    return Semantics(
      button: true,
      label: label,
      child: InkWell(
        key: const Key('listing-video'),
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: Stack(fit: StackFit.expand, children: [
              ColoredBox(
                color: Brand.ink,
                child: thumb == null ? null : CachedNetworkImage(imageUrl: thumb, fit: BoxFit.cover, errorWidget: (_, _, _) => const SizedBox()),
              ),
              Center(
                child: Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(color: video is YouTubeVideo ? const Color(0xFFD40000) : Brand.green, shape: BoxShape.circle),
                  child: const Icon(Icons.play_arrow, color: Colors.white, size: 40),
                ),
              ),
              Positioned(
                left: 10,
                bottom: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(6)),
                  child: Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

/// Full-screen player for an uploaded listing video (network URL or a local file in demo mode).
class VideoScreen extends StatefulWidget {
  const VideoScreen({super.key, required this.source, required this.title});
  final String source;
  final String title;

  @override
  State<VideoScreen> createState() => _VideoScreenState();
}

class _VideoScreenState extends State<VideoScreen> {
  late final VideoPlayerController _c;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _c = widget.source.startsWith('/') ? VideoPlayerController.file(File(widget.source)) : VideoPlayerController.networkUrl(Uri.parse(widget.source));
    _c.initialize().then((_) {
      if (mounted) setState(() {});
      _c.play();
    }).catchError((Object _) {
      if (mounted) setState(() => _failed = true);
    });
    _c.addListener(_tick);
  }

  void _tick() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _c.removeListener(_tick);
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ready = _c.value.isInitialized;
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(backgroundColor: Colors.black, foregroundColor: Colors.white, title: Text(widget.title, maxLines: 1, overflow: TextOverflow.ellipsis)),
      body: Center(
        child: _failed
            ? const Icon(Icons.error_outline, color: Colors.white54, size: 48)
            : !ready
                ? const CircularProgressIndicator()
                : GestureDetector(
                    onTap: () => _c.value.isPlaying ? _c.pause() : _c.play(),
                    child: AspectRatio(aspectRatio: _c.value.aspectRatio, child: VideoPlayer(_c)),
                  ),
      ),
      bottomNavigationBar: ready
          ? SafeArea(
              child: Row(children: [
                IconButton(
                  color: Colors.white,
                  icon: Icon(_c.value.isPlaying ? Icons.pause : Icons.play_arrow),
                  onPressed: () => _c.value.isPlaying ? _c.pause() : _c.play(),
                ),
                Expanded(child: VideoProgressIndicator(_c, allowScrubbing: true, padding: const EdgeInsets.symmetric(vertical: 16))),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(mmss(_c.value.position.inSeconds), style: const TextStyle(color: Colors.white)),
                ),
              ]),
            )
          : null,
    );
  }
}
