/** @typedef {import('$lib/shared/types/domain').FoundItem} FoundItem */
/** @typedef {import('$lib/shared/types/domain').LostItem} LostItem */
/** @typedef {import('$lib/shared/types/domain').MatchCandidate} MatchCandidate */
/** @typedef {import('$lib/shared/types/domain').MatchLevel} MatchLevel */

/**
 * @typedef {object} MatchableReport
 * @property {string} id
 * @property {string} description
 * @property {string} occurredAtText
 * @property {string} [location]
 * @property {string} [createdAt]
 */

/**
 * @typedef {object} MatchScore
 * @property {number} score
 * @property {MatchLevel} level
 * @property {string[]} reasons
 */

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

/** @param {string} value */
export function normalizeSearchText(value) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** @param {string} value */
export function tokenizeReport(value) {
  return normalizeSearchText(value)
    .split(' ')
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

/**
 * @param {string[]} left
 * @param {string[]} right
 */
function overlapScore(left, right) {
  if (!left.length || !right.length) return 0;
  const rightSet = new Set(right);
  const shared = left.filter((token) => rightSet.has(token));
  return shared.length / Math.max(left.length, right.length);
}

/**
 * @param {string} left
 * @param {string} right
 */
function timeHintScore(left, right) {
  const leftTokens = tokenizeReport(left);
  const rightTokens = tokenizeReport(right);
  return overlapScore(leftTokens, rightTokens);
}

/**
 * @param {MatchableReport} lost
 * @param {MatchableReport} found
 * @returns {MatchScore}
 */
export function scoreLostFoundMatch(lost, found) {
  const lostDescription = tokenizeReport(lost.description);
  const foundDescription = tokenizeReport(found.description);
  const description = overlapScore(lostDescription, foundDescription);
  const time = timeHintScore(lost.occurredAtText, found.occurredAtText);
  const location = found.location ? overlapScore(tokenizeReport(lost.description), tokenizeReport(found.location)) : 0;

  const score = Math.round(Math.min(1, description * 0.72 + time * 0.18 + location * 0.1) * 100);
  /** @type {MatchLevel} */
  const level = score >= 62 ? 'strong' : score >= 34 ? 'near' : 'none';
  const reasons = [
    description > 0 ? 'mô tả có tín hiệu trùng' : '',
    time > 0 ? 'thời gian gần nhau' : '',
    location > 0 ? 'vị trí có manh mối' : ''
  ].filter(Boolean);

  return { score, level, reasons };
}

/**
 * @param {LostItem} lost
 * @param {FoundItem} found
 * @returns {MatchCandidate | null}
 */
export function buildMatchCandidate(lost, found) {
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

/**
 * @param {LostItem[]} lostItems
 * @param {FoundItem[]} foundItems
 */
export function findCandidateMatches(lostItems, foundItems) {
  /** @type {MatchCandidate[]} */
  const candidates = [];

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
