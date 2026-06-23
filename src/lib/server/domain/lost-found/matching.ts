import type { FoundItem, LostItem, MatchCandidate, MatchLevel } from '$lib/shared/types/domain';

export interface MatchableReport {
  id: string;
  description: string;
  occurredAtText: string;
  location?: string;
  createdAt?: string;
}

export interface MatchScore {
  score: number;
  level: MatchLevel;
  reasons: string[];
}

const stopWords = new Set([
  'a',
  'an',
  'and',
  'bi',
  'cai',
  'cua',
  'da',
  'de',
  'do',
  'duoc',
  'em',
  'found',
  'in',
  'la',
  'lost',
  'mat',
  'minh',
  'mot',
  'nhat',
  'o',
  'tai',
  'the',
  'to',
  'toi',
  'trong',
  'va'
]);

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeReport(value: string) {
  return normalizeSearchText(value)
    .split(' ')
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function overlapScore(left: string[], right: string[]) {
  if (!left.length || !right.length) return 0;
  const rightSet = new Set(right);
  const shared = left.filter((token) => rightSet.has(token));
  return shared.length / Math.max(left.length, right.length);
}

function timeHintScore(left: string, right: string) {
  const leftTokens = tokenizeReport(left);
  const rightTokens = tokenizeReport(right);
  return overlapScore(leftTokens, rightTokens);
}

export function scoreLostFoundMatch(lost: MatchableReport, found: MatchableReport): MatchScore {
  const lostDescription = tokenizeReport(lost.description);
  const foundDescription = tokenizeReport(found.description);
  const description = overlapScore(lostDescription, foundDescription);
  const time = timeHintScore(lost.occurredAtText, found.occurredAtText);
  const location = found.location ? overlapScore(tokenizeReport(lost.description), tokenizeReport(found.location)) : 0;

  const score = Math.round(Math.min(1, description * 0.72 + time * 0.18 + location * 0.1) * 100);
  const level: MatchLevel = score >= 62 ? 'strong' : score >= 34 ? 'near' : 'none';
  const reasons = [
    description > 0 ? 'mô tả có tín hiệu trùng' : '',
    time > 0 ? 'thời gian gần nhau' : '',
    location > 0 ? 'vị trí có manh mối' : ''
  ].filter(Boolean);

  return { score, level, reasons };
}

export function buildMatchCandidate(lost: LostItem, found: FoundItem): MatchCandidate | null {
  const result = scoreLostFoundMatch(
    {
      id: lost.id,
      description: lost.description,
      occurredAtText: lost.lostAtText,
      createdAt: lost.createdAt
    },
    {
      id: found.id,
      description: found.description,
      occurredAtText: found.foundAtText,
      location: found.location,
      createdAt: found.createdAt
    }
  );

  if (result.level === 'none') return null;
  return {
    id: `${lost.id}:${found.id}`,
    lostItemId: lost.id,
    foundItemId: found.id,
    score: result.score,
    level: result.level,
    createdAt: new Date().toISOString()
  };
}

export function findCandidateMatches(lostItems: LostItem[], foundItems: FoundItem[]) {
  const candidates: MatchCandidate[] = [];

  for (const lost of lostItems) {
    if (!['open', 'matched'].includes(lost.status)) continue;
    for (const found of foundItems) {
      if (!['open', 'matched'].includes(found.status)) continue;
      const candidate = buildMatchCandidate(lost, found);
      if (candidate) candidates.push(candidate);
    }
  }

  return candidates.sort((left, right) => right.score - left.score);
}
