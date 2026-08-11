import Dexie, { type Table } from "dexie";
import type { Category, Difficulty } from "@/game/game-types";

export type WordEntry = {
  id: string;
  word: string;
  hint: string;
  category: Category;
  difficulty: Difficulty;
};

class ImposterWordDB extends Dexie {
  words!: Table<WordEntry, string>;

  constructor() {
    super("imposter-word-db");
    this.version(1).stores({
      // [category+difficulty] is the compound index getRandomLocalWord
      // actually queries by (see lib/local-words.ts).
      words: "id, category, difficulty, [category+difficulty]",
    });
  }
}

let dbInstance: ImposterWordDB | null = null;

/**
 * Lazily creates the Dexie instance. IndexedDB doesn't exist during SSR,
 * so this must never run at module-import time -- only when a client
 * component actually needs the database.
 */
export function getDb(): ImposterWordDB {
  if (typeof window === "undefined") {
    throw new Error("getDb() can only be called in the browser.");
  }
  if (!dbInstance) {
    dbInstance = new ImposterWordDB();
  }
  return dbInstance;
}

// Offline word collection. Deliberately generic/non-branded terms (e.g.
// "Sequel" instead of an actual movie title) so nothing here depends on
// third-party IP. Covers every category from game/game-rules.ts across
// all three difficulties, so offline play is never a degraded experience
// (see Screen 4 spec, sections 59-60).
const WORD_SEED: Omit<WordEntry, "id">[] = [
  // Food
  { word: "Pizza", hint: "A round dish often shared in slices.", category: "food", difficulty: "easy" },
  { word: "Burger", hint: "Usually eaten with two hands and a bun.", category: "food", difficulty: "easy" },
  { word: "Sushi", hint: "Often served in small, bite-sized pieces.", category: "food", difficulty: "medium" },
  { word: "Taco", hint: "Folded and filled, easy to eat on the go.", category: "food", difficulty: "medium" },
  { word: "Ceviche", hint: "The main ingredient is 'cooked' by an acid, not heat.", category: "food", difficulty: "hard" },
  { word: "Tiramisu", hint: "A layered dessert with a coffee-soaked base.", category: "food", difficulty: "hard" },

  // Animals
  { word: "Elephant", hint: "The largest land animal on Earth.", category: "animals", difficulty: "easy" },
  { word: "Dolphin", hint: "Known for being playful and highly intelligent in the water.", category: "animals", difficulty: "easy" },
  { word: "Penguin", hint: "Known for surviving in extremely cold environments.", category: "animals", difficulty: "medium" },
  { word: "Chameleon", hint: "Famous for blending into its surroundings.", category: "animals", difficulty: "medium" },
  { word: "Platypus", hint: "Lays eggs despite being a mammal.", category: "animals", difficulty: "hard" },
  { word: "Okapi", hint: "Striped legs but related to a much taller animal.", category: "animals", difficulty: "hard" },

  // Sports
  { word: "Soccer", hint: "The most popular sport in the world by fans.", category: "sports", difficulty: "easy" },
  { word: "Basketball", hint: "Played on a court with a hoop at each end.", category: "sports", difficulty: "easy" },
  { word: "Tennis", hint: "Played in singles or doubles, with a net in the middle.", category: "sports", difficulty: "medium" },
  { word: "Badminton", hint: "Played with a lightweight shuttle instead of a ball.", category: "sports", difficulty: "medium" },
  { word: "Curling", hint: "Players sweep the ice to guide a heavy stone.", category: "sports", difficulty: "hard" },
  { word: "Sumo", hint: "Competitors try to force each other out of a ring.", category: "sports", difficulty: "hard" },

  // Movies (generic film-industry terms -- no titles or IP)
  { word: "Sequel", hint: "A follow-up to something that came before it.", category: "movies", difficulty: "easy" },
  { word: "Trailer", hint: "A short preview shown before the main event.", category: "movies", difficulty: "easy" },
  { word: "Soundtrack", hint: "The music that plays behind the action.", category: "movies", difficulty: "medium" },
  { word: "Premiere", hint: "The very first public showing of something new.", category: "movies", difficulty: "medium" },
  { word: "Cameo", hint: "A brief, often surprising appearance by someone notable.", category: "movies", difficulty: "hard" },
  { word: "Anthology", hint: "A collection of separate stories grouped together.", category: "movies", difficulty: "hard" },

  // Countries
  { word: "Japan", hint: "An island nation known for its bullet trains.", category: "countries", difficulty: "easy" },
  { word: "Brazil", hint: "Home to the largest rainforest on the planet.", category: "countries", difficulty: "easy" },
  { word: "Canada", hint: "Known for its maple syrup and vast northern wilderness.", category: "countries", difficulty: "medium" },
  { word: "Egypt", hint: "Home to ancient monuments along a famous river.", category: "countries", difficulty: "medium" },
  { word: "Iceland", hint: "A land of geysers and volcanic landscapes.", category: "countries", difficulty: "hard" },
  { word: "Bhutan", hint: "A small Himalayan kingdom known for measuring national happiness.", category: "countries", difficulty: "hard" },

  // Vehicles
  { word: "Bicycle", hint: "You balance and pedal to keep it moving.", category: "vehicles", difficulty: "easy" },
  { word: "Helicopter", hint: "It can hover in place using spinning blades.", category: "vehicles", difficulty: "easy" },
  { word: "Submarine", hint: "Built to travel far below the surface.", category: "vehicles", difficulty: "medium" },
  { word: "Tractor", hint: "A common sight on farms, built for heavy pulling.", category: "vehicles", difficulty: "medium" },
  { word: "Gondola", hint: "Traditionally guided through canals with a single oar.", category: "vehicles", difficulty: "hard" },
  { word: "Zeppelin", hint: "A large, rigid airship once used for passenger travel.", category: "vehicles", difficulty: "hard" },

  // Jobs
  { word: "Dentist", hint: "You visit this person for regular checkups on your smile.", category: "jobs", difficulty: "easy" },
  { word: "Astronaut", hint: "Trained to travel far above the clouds.", category: "jobs", difficulty: "easy" },
  { word: "Plumber", hint: "Called when a pipe starts leaking.", category: "jobs", difficulty: "medium" },
  { word: "Librarian", hint: "Helps people find what they're looking for among the shelves.", category: "jobs", difficulty: "medium" },
  { word: "Blacksmith", hint: "Shapes metal using fire and a hammer.", category: "jobs", difficulty: "hard" },
  { word: "Cartographer", hint: "Their work helps travelers find their way.", category: "jobs", difficulty: "hard" },

  // Nature
  { word: "Waterfall", hint: "Water drops suddenly from a height.", category: "nature", difficulty: "easy" },
  { word: "Volcano", hint: "Can stay quiet for years before suddenly erupting.", category: "nature", difficulty: "easy" },
  { word: "Glacier", hint: "A slow-moving mass that shaped many valleys.", category: "nature", difficulty: "medium" },
  { word: "Meadow", hint: "An open field often full of wildflowers.", category: "nature", difficulty: "medium" },
  { word: "Coral Reef", hint: "A colorful underwater ecosystem built over centuries.", category: "nature", difficulty: "hard" },
  { word: "Geyser", hint: "Known for shooting hot water into the air on a schedule.", category: "nature", difficulty: "hard" },

  // Everyday Things
  { word: "Umbrella", hint: "You open it up when the sky turns grey.", category: "everyday", difficulty: "easy" },
  { word: "Backpack", hint: "Carried on your shoulders, usually to school or on a trip.", category: "everyday", difficulty: "easy" },
  { word: "Toothbrush", hint: "Used twice a day as part of a daily routine.", category: "everyday", difficulty: "medium" },
  { word: "Doorknob", hint: "You turn it every time you enter a room.", category: "everyday", difficulty: "medium" },
  { word: "Thermostat", hint: "A small device that quietly controls comfort in a room.", category: "everyday", difficulty: "hard" },
  { word: "Stapler", hint: "A small desk tool that binds pages together.", category: "everyday", difficulty: "hard" },

  // Technology
  { word: "Smartphone", hint: "Most people check this within minutes of waking up.", category: "technology", difficulty: "easy" },
  { word: "Drone", hint: "Flies without a pilot on board.", category: "technology", difficulty: "easy" },
  { word: "Router", hint: "A small box that quietly keeps a household connected.", category: "technology", difficulty: "medium" },
  { word: "Printer", hint: "Turns a digital file into something you can hold.", category: "technology", difficulty: "medium" },
  { word: "Microchip", hint: "Tiny, but it powers almost everything electronic.", category: "technology", difficulty: "hard" },
  { word: "Hologram", hint: "A projection that appears to have real depth.", category: "technology", difficulty: "hard" },

  // Places
  { word: "Museum", hint: "A quiet building full of history and artifacts.", category: "places", difficulty: "easy" },
  { word: "Airport", hint: "Where journeys begin and end, high above the clouds.", category: "places", difficulty: "easy" },
  { word: "Lighthouse", hint: "Stands tall along the coast, guiding others at night.", category: "places", difficulty: "medium" },
  { word: "Greenhouse", hint: "A glass structure that traps warmth for growing things.", category: "places", difficulty: "medium" },
  { word: "Observatory", hint: "A building designed for looking far beyond the clouds.", category: "places", difficulty: "hard" },
  { word: "Catacombs", hint: "Winding underground passages with a long, quiet history.", category: "places", difficulty: "hard" },

  // Random Objects
  { word: "Compass", hint: "Always points you in a reliable direction.", category: "objects", difficulty: "easy" },
  { word: "Anchor", hint: "Dropped to keep something from drifting away.", category: "objects", difficulty: "easy" },
  { word: "Hourglass", hint: "Marks time by letting something fall slowly.", category: "objects", difficulty: "medium" },
  { word: "Telescope", hint: "Brings distant things dramatically closer.", category: "objects", difficulty: "medium" },
  { word: "Chandelier", hint: "Hangs from above, catching the light in a room.", category: "objects", difficulty: "hard" },
  { word: "Kaleidoscope", hint: "A twist of the hand rearranges its colorful patterns.", category: "objects", difficulty: "hard" },
];

let seedPromise: Promise<void> | null = null;

/**
 * Populates the local word collection on first run only. Safe to call
 * repeatedly -- subsequent calls resolve instantly once seeding has
 * happened once per session.
 */
export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const db = getDb();
      const count = await db.words.count();
      if (count > 0) return;
      await db.words.bulkPut(
        WORD_SEED.map((entry, i) => ({ id: `seed-${i}`, ...entry })),
      );
    })();
  }
  return seedPromise;
}