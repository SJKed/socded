import defaultPack from './topics/default.json';

const packs: Record<string, string[]> = {
  default: defaultPack.topics,
};

export function getTopics(packName: string): string[] {
  return packs[packName] ?? packs['default'];
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildEasyModeHints(topic: string, packName: string): string[] {
  const topics = getTopics(packName);
  const decoys = topics.filter((t) => t !== topic);
  shuffle(decoys);
  const hints = [topic, decoys[0], decoys[1]];
  shuffle(hints);
  return hints;
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
