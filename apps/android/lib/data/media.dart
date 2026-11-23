/// Listing videos: one uploaded video (compressed on the phone) or a YouTube link.
/// Mirrors packages/shared/src/media.ts (limits and YouTube parsing are tested against it).
library;

import 'dart:async';
import 'dart:typed_data';

import 'package:image_picker/image_picker.dart';
import 'package:video_compress/video_compress.dart';

const videoMaxSeconds = 120; // 2 minutes
const videoMaxBytes = 60 * 1024 * 1024;

/// YouTube video id (11 chars) from any common link, or null.
String? parseYouTubeId(String input) {
  final s = input.trim();
  if (RegExp(r'^[A-Za-z0-9_-]{11}$').hasMatch(s)) return s;
  final patterns = [
    RegExp(r'^(?:https?://)?(?:www\.|m\.|music\.)?youtube\.com/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{11})(?:[&#]|$)'),
    RegExp(r'^(?:https?://)?(?:www\.|m\.)?youtube\.com/(?:shorts|embed|live|v)/([A-Za-z0-9_-]{11})(?:[/?#]|$)'),
    RegExp(r'^(?:https?://)?youtu\.be/([A-Za-z0-9_-]{11})(?:[/?#]|$)'),
  ];
  for (final p in patterns) {
    final m = p.firstMatch(s);
    if (m != null) return m[1];
  }
  return null;
}

String youTubeThumb(String id) => 'https://i.ytimg.com/vi/$id/hqdefault.jpg';
String youTubeWatch(String id) => 'https://www.youtube.com/watch?v=$id';

/// A video shown on a listing (read side).
sealed class ListingVideo {
  const ListingVideo();
}

class FileVideo extends ListingVideo {
  final String path; // Storage path (or a local/demo URL)
  final String? posterPath;
  final int? durationSec;
  const FileVideo(this.path, {this.posterPath, this.durationSec});
}

class YouTubeVideo extends ListingVideo {
  final String id;
  const YouTubeVideo(this.id);
}

/// What the seller attaches when posting (write side).
sealed class VideoAttachment {
  const VideoAttachment();
}

/// A compressed MP4 on the phone, ready to upload.
class PreparedVideo extends VideoAttachment {
  final String filePath;
  final Uint8List? poster; // JPEG still frame
  final int durationSec;
  final int bytes;
  const PreparedVideo({required this.filePath, this.poster, required this.durationSec, required this.bytes});
}

class YouTubeAttachment extends VideoAttachment {
  final String id;
  const YouTubeAttachment(this.id);
}

class VideoTooLong implements Exception {
  final int seconds;
  VideoTooLong(this.seconds);
}

/// Reads and compresses a video on the phone (replaced by a fake in tests).
abstract class VideoTools {
  /// Lets the seller record or choose a video; returns its file path or null if cancelled.
  Future<String?> pick({required bool camera});

  /// Duration in seconds of the picked file.
  Future<int> durationSec(String path);

  /// Compresses to 720p H.264 and makes a poster frame. [onProgress] gets 0–100.
  Future<PreparedVideo> compress(String path, {void Function(double percent)? onProgress});

  Future<void> cancel();
}

class DeviceVideoTools implements VideoTools {
  final _picker = ImagePicker();

  @override
  Future<String?> pick({required bool camera}) async {
    final f = await _picker.pickVideo(
      source: camera ? ImageSource.camera : ImageSource.gallery,
      maxDuration: const Duration(seconds: videoMaxSeconds),
    );
    return f?.path;
  }

  @override
  Future<int> durationSec(String path) async {
    final info = await VideoCompress.getMediaInfo(path);
    return ((info.duration ?? 0) / 1000).round();
  }

  @override
  Future<PreparedVideo> compress(String path, {void Function(double percent)? onProgress}) async {
    final seconds = await durationSec(path);
    if (seconds > videoMaxSeconds) throw VideoTooLong(seconds);
    final sub = VideoCompress.compressProgress$.subscribe((p) => onProgress?.call(p));
    try {
      final out = await VideoCompress.compressVideo(
        path,
        quality: VideoQuality.Res1280x720Quality,
        deleteOrigin: false,
        includeAudio: true,
        frameRate: 30,
      );
      final file = out?.file;
      if (out == null || file == null) throw StateError('compression failed');
      final poster = await VideoCompress.getByteThumbnail(path, quality: 70, position: -1);
      return PreparedVideo(filePath: file.path, poster: poster, durationSec: seconds, bytes: out.filesize ?? await file.length());
    } finally {
      sub.unsubscribe();
    }
  }

  @override
  Future<void> cancel() => VideoCompress.cancelCompression();
}

/// 75 → "1:15"
String mmss(int seconds) => '${seconds ~/ 60}:${(seconds % 60).toString().padLeft(2, '0')}';
