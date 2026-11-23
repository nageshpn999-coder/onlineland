import { describe, expect, it } from 'vitest';
import { parseYouTubeId } from '@onlineland/shared';

describe('YouTube links', () => {
  it('reads the id from every common link', () => {
    for (const url of [
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=10',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'youtu.be/dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ?si=abc',
      'https://www.youtube.com/shorts/dQw4w9WgXcQ',
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
      'dQw4w9WgXcQ',
    ]) {
      expect(parseYouTubeId(url), url).toBe('dQw4w9WgXcQ');
    }
  });
  it('rejects anything else', () => {
    for (const bad of ['', 'hello', 'https://vimeo.com/123', 'https://evil.com/watch?v=dQw4w9WgXcQ', 'https://youtube.com/watch?v=short']) {
      expect(parseYouTubeId(bad), bad).toBeNull();
    }
  });
});
