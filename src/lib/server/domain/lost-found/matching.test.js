import { describe, expect, it } from 'vitest';
import { scoreLostFoundMatch } from './matching';

describe('lost/found matching', () => {
  it('scores matching descriptions as strong signals', () => {
    const result = scoreLostFoundMatch(
      {
        id: 'lost-1',
        description: 'Bình nước xanh sticker mặt trăng',
        occurredAtText: 'chiều thứ sáu'
      },
      {
        id: 'found-1',
        description: 'Bình nước xanh có sticker trăng',
        occurredAtText: 'cuối chiều thứ sáu',
        location: 'pantry tầng 12'
      }
    );

    expect(result.level).toBe('strong');
    expect(result.score).toBeGreaterThanOrEqual(62);
  });

  it('keeps unrelated reports out of the match queue', () => {
    const result = scoreLostFoundMatch(
      {
        id: 'lost-1',
        description: 'Tai nghe đen trong hộp nhỏ',
        occurredAtText: 'sáng thứ hai'
      },
      {
        id: 'found-1',
        description: 'Áo khoác xám treo gần thang máy',
        occurredAtText: 'tối thứ sáu',
        location: 'sảnh chính'
      }
    );

    expect(result.level).toBe('none');
  });
});
