import type { Category, Difficulty } from "@/game/game-types";
import { getRecentWordIds, rememberWordId } from "./recent-words";

export type FallbackWordEntry = {
  id: string;
  word: string;
  hint: string;
  category: Category;
  difficulty: Difficulty;
};

/**
 * TIER 3 -- STATIC FALLBACK (final emergency fallback only).
 *
 * This array ships in the application bundle and is used ONLY when both
 * of these have failed:
 *   1. AI generation
 *   2. The IndexedDB AI-cache lookup (see lib/db.ts)
 *
 * IMPORTANT: entries here must NEVER be written into IndexedDB. The
 * cache in lib/db.ts is reserved exclusively for real AI-generated
 * content (`source: "ai"`). Keeping this array separate is what lets
 * Screen 4 tell the difference between "this round came from the AI
 * cache" and "this round came from the last-resort static list" (see
 * providers/fallback-word-provider.ts and providers/indexeddb-cache-provider.ts).
 *
 * Deliberately generic/non-branded terms (e.g. "Sequel" instead of an
 * actual movie title) so nothing here depends on third-party IP. Covers
 * every category from game/game-rules.ts across all three difficulties,
 * so a total-failure round is never a degraded experience.
 */
export const FALLBACK_WORDS: FallbackWordEntry[] = [
  // Food
  {
    id: "fallback-food-1",
    word: "Pizza",
    hint: "A round dish often shared in slices.",
    category: "food",
    difficulty: "easy",
  },
  {
    id: "fallback-food-2",
    word: "Burger",
    hint: "Usually eaten with two hands and a bun.",
    category: "food",
    difficulty: "easy",
  },
  {
    id: "fallback-food-3",
    word: "Sushi",
    hint: "Often served in small, bite-sized pieces.",
    category: "food",
    difficulty: "medium",
  },
  {
    id: "fallback-food-4",
    word: "Taco",
    hint: "Folded and filled, easy to eat on the go.",
    category: "food",
    difficulty: "medium",
  },
  {
    id: "fallback-food-5",
    word: "Ceviche",
    hint: "The main ingredient is 'cooked' by an acid, not heat.",
    category: "food",
    difficulty: "hard",
  },
  {
    id: "fallback-food-6",
    word: "Tiramisu",
    hint: "A layered dessert with a coffee-soaked base.",
    category: "food",
    difficulty: "hard",
  },

  // Animals
  {
    id: "fallback-animals-1",
    word: "Elephant",
    hint: "The largest land animal on Earth.",
    category: "animals",
    difficulty: "easy",
  },
  {
    id: "fallback-animals-2",
    word: "Dolphin",
    hint: "Known for being playful and highly intelligent in the water.",
    category: "animals",
    difficulty: "easy",
  },
  {
    id: "fallback-animals-3",
    word: "Penguin",
    hint: "Known for surviving in extremely cold environments.",
    category: "animals",
    difficulty: "medium",
  },
  {
    id: "fallback-animals-4",
    word: "Chameleon",
    hint: "Famous for blending into its surroundings.",
    category: "animals",
    difficulty: "medium",
  },
  {
    id: "fallback-animals-5",
    word: "Platypus",
    hint: "Lays eggs despite being a mammal.",
    category: "animals",
    difficulty: "hard",
  },
  {
    id: "fallback-animals-6",
    word: "Okapi",
    hint: "Striped legs but related to a much taller animal.",
    category: "animals",
    difficulty: "hard",
  },

  // Sports
  {
    id: "fallback-sports-1",
    word: "Soccer",
    hint: "The most popular sport in the world by fans.",
    category: "sports",
    difficulty: "easy",
  },
  {
    id: "fallback-sports-2",
    word: "Basketball",
    hint: "Played on a court with a hoop at each end.",
    category: "sports",
    difficulty: "easy",
  },
  {
    id: "fallback-sports-3",
    word: "Tennis",
    hint: "Played in singles or doubles, with a net in the middle.",
    category: "sports",
    difficulty: "medium",
  },
  {
    id: "fallback-sports-4",
    word: "Badminton",
    hint: "Played with a lightweight shuttle instead of a ball.",
    category: "sports",
    difficulty: "medium",
  },
  {
    id: "fallback-sports-5",
    word: "Curling",
    hint: "Players sweep the ice to guide a heavy stone.",
    category: "sports",
    difficulty: "hard",
  },
  {
    id: "fallback-sports-6",
    word: "Sumo",
    hint: "Competitors try to force each other out of a ring.",
    category: "sports",
    difficulty: "hard",
  },

  // Movies (generic film-industry terms -- no titles or IP)
  {
    id: "fallback-movies-1",
    word: "Sequel",
    hint: "A follow-up to something that came before it.",
    category: "movies",
    difficulty: "easy",
  },
  {
    id: "fallback-movies-2",
    word: "Trailer",
    hint: "A short preview shown before the main event.",
    category: "movies",
    difficulty: "easy",
  },
  {
    id: "fallback-movies-3",
    word: "Soundtrack",
    hint: "The music that plays behind the action.",
    category: "movies",
    difficulty: "medium",
  },
  {
    id: "fallback-movies-4",
    word: "Premiere",
    hint: "The very first public showing of something new.",
    category: "movies",
    difficulty: "medium",
  },
  {
    id: "fallback-movies-5",
    word: "Cameo",
    hint: "A brief, often surprising appearance by someone notable.",
    category: "movies",
    difficulty: "hard",
  },
  {
    id: "fallback-movies-6",
    word: "Anthology",
    hint: "A collection of separate stories grouped together.",
    category: "movies",
    difficulty: "hard",
  },

  // Countries
  {
    id: "fallback-countries-1",
    word: "Japan",
    hint: "An island nation known for its bullet trains.",
    category: "countries",
    difficulty: "easy",
  },
  {
    id: "fallback-countries-2",
    word: "Brazil",
    hint: "Home to the largest rainforest on the planet.",
    category: "countries",
    difficulty: "easy",
  },
  {
    id: "fallback-countries-3",
    word: "Canada",
    hint: "Known for its maple syrup and vast northern wilderness.",
    category: "countries",
    difficulty: "medium",
  },
  {
    id: "fallback-countries-4",
    word: "Egypt",
    hint: "Home to ancient monuments along a famous river.",
    category: "countries",
    difficulty: "medium",
  },
  {
    id: "fallback-countries-5",
    word: "Iceland",
    hint: "A land of geysers and volcanic landscapes.",
    category: "countries",
    difficulty: "hard",
  },
  {
    id: "fallback-countries-6",
    word: "Bhutan",
    hint: "A small Himalayan kingdom known for measuring national happiness.",
    category: "countries",
    difficulty: "hard",
  },

  // Vehicles
  {
    id: "fallback-vehicles-1",
    word: "Bicycle",
    hint: "You balance and pedal to keep it moving.",
    category: "vehicles",
    difficulty: "easy",
  },
  {
    id: "fallback-vehicles-2",
    word: "Helicopter",
    hint: "It can hover in place using spinning blades.",
    category: "vehicles",
    difficulty: "easy",
  },
  {
    id: "fallback-vehicles-3",
    word: "Submarine",
    hint: "Built to travel far below the surface.",
    category: "vehicles",
    difficulty: "medium",
  },
  {
    id: "fallback-vehicles-4",
    word: "Tractor",
    hint: "A common sight on farms, built for heavy pulling.",
    category: "vehicles",
    difficulty: "medium",
  },
  {
    id: "fallback-vehicles-5",
    word: "Gondola",
    hint: "Traditionally guided through canals with a single oar.",
    category: "vehicles",
    difficulty: "hard",
  },
  {
    id: "fallback-vehicles-6",
    word: "Zeppelin",
    hint: "A large, rigid airship once used for passenger travel.",
    category: "vehicles",
    difficulty: "hard",
  },

  // Jobs
  {
    id: "fallback-jobs-1",
    word: "Dentist",
    hint: "You visit this person for regular checkups on your smile.",
    category: "jobs",
    difficulty: "easy",
  },
  {
    id: "fallback-jobs-2",
    word: "Astronaut",
    hint: "Trained to travel far above the clouds.",
    category: "jobs",
    difficulty: "easy",
  },
  {
    id: "fallback-jobs-3",
    word: "Plumber",
    hint: "Called when a pipe starts leaking.",
    category: "jobs",
    difficulty: "medium",
  },
  {
    id: "fallback-jobs-4",
    word: "Librarian",
    hint: "Helps people find what they're looking for among the shelves.",
    category: "jobs",
    difficulty: "medium",
  },
  {
    id: "fallback-jobs-5",
    word: "Blacksmith",
    hint: "Shapes metal using fire and a hammer.",
    category: "jobs",
    difficulty: "hard",
  },
  {
    id: "fallback-jobs-6",
    word: "Cartographer",
    hint: "Their work helps travelers find their way.",
    category: "jobs",
    difficulty: "hard",
  },

  // Nature
  {
    id: "fallback-nature-1",
    word: "Waterfall",
    hint: "Water drops suddenly from a height.",
    category: "nature",
    difficulty: "easy",
  },
  {
    id: "fallback-nature-2",
    word: "Volcano",
    hint: "Can stay quiet for years before suddenly erupting.",
    category: "nature",
    difficulty: "easy",
  },
  {
    id: "fallback-nature-3",
    word: "Glacier",
    hint: "A slow-moving mass that shaped many valleys.",
    category: "nature",
    difficulty: "medium",
  },
  {
    id: "fallback-nature-4",
    word: "Meadow",
    hint: "An open field often full of wildflowers.",
    category: "nature",
    difficulty: "medium",
  },
  {
    id: "fallback-nature-5",
    word: "Coral Reef",
    hint: "A colorful underwater ecosystem built over centuries.",
    category: "nature",
    difficulty: "hard",
  },
  {
    id: "fallback-nature-6",
    word: "Geyser",
    hint: "Known for shooting hot water into the air on a schedule.",
    category: "nature",
    difficulty: "hard",
  },

  // Everyday Things
  {
    id: "fallback-everyday-1",
    word: "Umbrella",
    hint: "You open it up when the sky turns grey.",
    category: "everyday",
    difficulty: "easy",
  },
  {
    id: "fallback-everyday-2",
    word: "Backpack",
    hint: "Carried on your shoulders, usually to school or on a trip.",
    category: "everyday",
    difficulty: "easy",
  },
  {
    id: "fallback-everyday-3",
    word: "Toothbrush",
    hint: "Used twice a day as part of a daily routine.",
    category: "everyday",
    difficulty: "medium",
  },
  {
    id: "fallback-everyday-4",
    word: "Doorknob",
    hint: "You turn it every time you enter a room.",
    category: "everyday",
    difficulty: "medium",
  },
  {
    id: "fallback-everyday-5",
    word: "Thermostat",
    hint: "A small device that quietly controls comfort in a room.",
    category: "everyday",
    difficulty: "hard",
  },
  {
    id: "fallback-everyday-6",
    word: "Stapler",
    hint: "A small desk tool that binds pages together.",
    category: "everyday",
    difficulty: "hard",
  },

  // Technology
  {
    id: "fallback-technology-1",
    word: "Smartphone",
    hint: "Most people check this within minutes of waking up.",
    category: "technology",
    difficulty: "easy",
  },
  {
    id: "fallback-technology-2",
    word: "Drone",
    hint: "Flies without a pilot on board.",
    category: "technology",
    difficulty: "easy",
  },
  {
    id: "fallback-technology-3",
    word: "Router",
    hint: "A small box that quietly keeps a household connected.",
    category: "technology",
    difficulty: "medium",
  },
  {
    id: "fallback-technology-4",
    word: "Printer",
    hint: "Turns a digital file into something you can hold.",
    category: "technology",
    difficulty: "medium",
  },
  {
    id: "fallback-technology-5",
    word: "Microchip",
    hint: "Tiny, but it powers almost everything electronic.",
    category: "technology",
    difficulty: "hard",
  },
  {
    id: "fallback-technology-6",
    word: "Hologram",
    hint: "A projection that appears to have real depth.",
    category: "technology",
    difficulty: "hard",
  },

  // Places
  {
    id: "fallback-places-1",
    word: "Museum",
    hint: "A quiet building full of history and artifacts.",
    category: "places",
    difficulty: "easy",
  },
  {
    id: "fallback-places-2",
    word: "Airport",
    hint: "Where journeys begin and end, high above the clouds.",
    category: "places",
    difficulty: "easy",
  },
  {
    id: "fallback-places-3",
    word: "Lighthouse",
    hint: "Stands tall along the coast, guiding others at night.",
    category: "places",
    difficulty: "medium",
  },
  {
    id: "fallback-places-4",
    word: "Greenhouse",
    hint: "A glass structure that traps warmth for growing things.",
    category: "places",
    difficulty: "medium",
  },
  {
    id: "fallback-places-5",
    word: "Observatory",
    hint: "A building designed for looking far beyond the clouds.",
    category: "places",
    difficulty: "hard",
  },
  {
    id: "fallback-places-6",
    word: "Catacombs",
    hint: "Winding underground passages with a long, quiet history.",
    category: "places",
    difficulty: "hard",
  },

  // Random Objects
  {
    id: "fallback-objects-1",
    word: "Compass",
    hint: "Always points you in a reliable direction.",
    category: "objects",
    difficulty: "easy",
  },
  {
    id: "fallback-objects-2",
    word: "Anchor",
    hint: "Dropped to keep something from drifting away.",
    category: "objects",
    difficulty: "easy",
  },
  {
    id: "fallback-objects-3",
    word: "Hourglass",
    hint: "Marks time by letting something fall slowly.",
    category: "objects",
    difficulty: "medium",
  },
  {
    id: "fallback-objects-4",
    word: "Telescope",
    hint: "Brings distant things dramatically closer.",
    category: "objects",
    difficulty: "medium",
  },
  {
    id: "fallback-objects-5",
    word: "Chandelier",
    hint: "Hangs from above, catching the light in a room.",
    category: "objects",
    difficulty: "hard",
  },
  {
    id: "fallback-objects-6",
    word: "Kaleidoscope",
    hint: "A twist of the hand rearranges its colorful patterns.",
    category: "objects",
    difficulty: "hard",
  },
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Picks a random entry from the static fallback array, matching
 * category + difficulty as closely as possible via the same graceful
 * tiers the (now-removed) local DB lookup used to have:
 *
 *   1. Exact category + difficulty, excluding recently used words
 *   2. Exact category + difficulty (recent words allowed)
 *   3. Exact category, any difficulty
 *   4. Any category, exact difficulty
 *   5. Any entry in the array
 *
 * This function is synchronous and can never fail -- `FALLBACK_WORDS`
 * is a non-empty compile-time constant, so tier 5 always has something
 * to return. That's what makes it safe as the final fallback: nothing
 * upstream of this needs to handle a "fallback also failed" case.
 */
export function getRandomFallbackWord(
  category: Category,
  difficulty: Difficulty,
): FallbackWordEntry {
  const isRandomCategory = category === "random";
  const matching = FALLBACK_WORDS.filter(
    (w) =>
      (isRandomCategory || w.category === category) &&
      w.difficulty === difficulty,
  );

  if (matching.length === 0) {
    throw new Error(
      `No fallback word available for category "${category}" and difficulty "${difficulty}".`,
    );
  }

  const recentIds = new Set(getRecentWordIds());
  const nonRecent = matching.filter((w) => !recentIds.has(w.id));
  const pool = nonRecent.length > 0 ? nonRecent : matching;

  const entry = pickRandom(pool);
  rememberWordId(entry.id);

  return entry;
}
