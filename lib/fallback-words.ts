import type { Category, Difficulty, GameLanguage } from "@/game/game-types";
import { getRecentWordIds, rememberWordId } from "./recent-words";

export type FallbackWordEntry = {
  id: string;
  word: string;
  hint: string;
  category: Category;
  difficulty: Difficulty;
  /**
   * The language this static entry's word/hint were written in. Stored
   * explicitly (never inferred from the text) so getRandomFallbackWord
   * can filter by it directly -- same principle as WordEntry.language in
   * lib/db.ts. Every entry below is tagged "english" or "roman-urdu"
   * accordingly; there is no untagged/legacy entry in this file since
   * it's a compile-time constant, not persisted user data.
   */
  language: GameLanguage;
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
 *
 * Roman Urdu coverage mirrors the English list exactly (same 12
 * categories x 3 difficulties) -- see the second block below -- so
 * getRandomFallbackWord never has to relax category/difficulty just
 * because Roman Urdu was selected (spec: "Offline Roman Urdu must work
 * ... enough entries to make offline Roman Urdu mode practically
 * usable"). The Roman Urdu *word* deliberately stays the same common
 * term as its English counterpart in most cases (e.g. "Pizza") -- only
 * the hint is written in natural Roman Urdu -- matching spec section 5
 * ("Roman Urdu mode does NOT mean every word must be translated").
 */
export const FALLBACK_WORDS: FallbackWordEntry[] = [
  // ---------------------------------------------------------------
  // English
  // ---------------------------------------------------------------
  // Food
  {
    id: "fallback-food-1",
    word: "Pizza",
    hint: "A round dish often shared in slices.",
    category: "food",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-food-2",
    word: "Burger",
    hint: "Usually eaten with two hands and a bun.",
    category: "food",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-food-3",
    word: "Sushi",
    hint: "Often served in small, bite-sized pieces.",
    category: "food",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-food-4",
    word: "Taco",
    hint: "Folded and filled, easy to eat on the go.",
    category: "food",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-food-5",
    word: "Ceviche",
    hint: "The main ingredient is 'cooked' by an acid, not heat.",
    category: "food",
    difficulty: "hard",
    language: "english",
  },
  {
    id: "fallback-food-6",
    word: "Tiramisu",
    hint: "A layered dessert with a coffee-soaked base.",
    category: "food",
    difficulty: "hard",
    language: "english",
  },

  // Animals
  {
    id: "fallback-animals-1",
    word: "Elephant",
    hint: "The largest land animal on Earth.",
    category: "animals",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-animals-2",
    word: "Dolphin",
    hint: "Known for being playful and highly intelligent in the water.",
    category: "animals",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-animals-3",
    word: "Penguin",
    hint: "Known for surviving in extremely cold environments.",
    category: "animals",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-animals-4",
    word: "Chameleon",
    hint: "Famous for blending into its surroundings.",
    category: "animals",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-animals-5",
    word: "Platypus",
    hint: "Lays eggs despite being a mammal.",
    category: "animals",
    difficulty: "hard",
    language: "english",
  },
  {
    id: "fallback-animals-6",
    word: "Okapi",
    hint: "Striped legs but related to a much taller animal.",
    category: "animals",
    difficulty: "hard",
    language: "english",
  },

  // Sports
  {
    id: "fallback-sports-1",
    word: "Soccer",
    hint: "The most popular sport in the world by fans.",
    category: "sports",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-sports-2",
    word: "Basketball",
    hint: "Played on a court with a hoop at each end.",
    category: "sports",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-sports-3",
    word: "Tennis",
    hint: "Played in singles or doubles, with a net in the middle.",
    category: "sports",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-sports-4",
    word: "Badminton",
    hint: "Played with a lightweight shuttle instead of a ball.",
    category: "sports",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-sports-5",
    word: "Curling",
    hint: "Players sweep the ice to guide a heavy stone.",
    category: "sports",
    difficulty: "hard",
    language: "english",
  },
  {
    id: "fallback-sports-6",
    word: "Sumo",
    hint: "Competitors try to force each other out of a ring.",
    category: "sports",
    difficulty: "hard",
    language: "english",
  },

  // Movies (generic film-industry terms -- no titles or IP)
  {
    id: "fallback-movies-1",
    word: "Sequel",
    hint: "A follow-up to something that came before it.",
    category: "movies",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-movies-2",
    word: "Trailer",
    hint: "A short preview shown before the main event.",
    category: "movies",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-movies-3",
    word: "Soundtrack",
    hint: "The music that plays behind the action.",
    category: "movies",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-movies-4",
    word: "Premiere",
    hint: "The very first public showing of something new.",
    category: "movies",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-movies-5",
    word: "Cameo",
    hint: "A brief, often surprising appearance by someone notable.",
    category: "movies",
    difficulty: "hard",
    language: "english",
  },
  {
    id: "fallback-movies-6",
    word: "Anthology",
    hint: "A collection of separate stories grouped together.",
    category: "movies",
    difficulty: "hard",
    language: "english",
  },

  // Countries
  {
    id: "fallback-countries-1",
    word: "Japan",
    hint: "An island nation known for its bullet trains.",
    category: "countries",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-countries-2",
    word: "Brazil",
    hint: "Home to the largest rainforest on the planet.",
    category: "countries",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-countries-3",
    word: "Canada",
    hint: "Known for its maple syrup and vast northern wilderness.",
    category: "countries",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-countries-4",
    word: "Egypt",
    hint: "Home to ancient monuments along a famous river.",
    category: "countries",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-countries-5",
    word: "Iceland",
    hint: "A land of geysers and volcanic landscapes.",
    category: "countries",
    difficulty: "hard",
    language: "english",
  },
  {
    id: "fallback-countries-6",
    word: "Bhutan",
    hint: "A small Himalayan kingdom known for measuring national happiness.",
    category: "countries",
    difficulty: "hard",
    language: "english",
  },

  // Vehicles
  {
    id: "fallback-vehicles-1",
    word: "Bicycle",
    hint: "You balance and pedal to keep it moving.",
    category: "vehicles",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-vehicles-2",
    word: "Helicopter",
    hint: "It can hover in place using spinning blades.",
    category: "vehicles",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-vehicles-3",
    word: "Submarine",
    hint: "Built to travel far below the surface.",
    category: "vehicles",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-vehicles-4",
    word: "Tractor",
    hint: "A common sight on farms, built for heavy pulling.",
    category: "vehicles",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-vehicles-5",
    word: "Gondola",
    hint: "Traditionally guided through canals with a single oar.",
    category: "vehicles",
    difficulty: "hard",
    language: "english",
  },
  {
    id: "fallback-vehicles-6",
    word: "Zeppelin",
    hint: "A large, rigid airship once used for passenger travel.",
    category: "vehicles",
    difficulty: "hard",
    language: "english",
  },

  // Jobs
  {
    id: "fallback-jobs-1",
    word: "Dentist",
    hint: "You visit this person for regular checkups on your smile.",
    category: "jobs",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-jobs-2",
    word: "Astronaut",
    hint: "Trained to travel far above the clouds.",
    category: "jobs",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-jobs-3",
    word: "Plumber",
    hint: "Called when a pipe starts leaking.",
    category: "jobs",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-jobs-4",
    word: "Librarian",
    hint: "Helps people find what they're looking for among the shelves.",
    category: "jobs",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-jobs-5",
    word: "Blacksmith",
    hint: "Shapes metal using fire and a hammer.",
    category: "jobs",
    difficulty: "hard",
    language: "english",
  },
  {
    id: "fallback-jobs-6",
    word: "Cartographer",
    hint: "Their work helps travelers find their way.",
    category: "jobs",
    difficulty: "hard",
    language: "english",
  },

  // Nature
  {
    id: "fallback-nature-1",
    word: "Waterfall",
    hint: "Water drops suddenly from a height.",
    category: "nature",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-nature-2",
    word: "Volcano",
    hint: "Can stay quiet for years before suddenly erupting.",
    category: "nature",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-nature-3",
    word: "Glacier",
    hint: "A slow-moving mass that shaped many valleys.",
    category: "nature",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-nature-4",
    word: "Meadow",
    hint: "An open field often full of wildflowers.",
    category: "nature",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-nature-5",
    word: "Coral Reef",
    hint: "A colorful underwater ecosystem built over centuries.",
    category: "nature",
    difficulty: "hard",
    language: "english",
  },
  {
    id: "fallback-nature-6",
    word: "Geyser",
    hint: "Known for shooting hot water into the air on a schedule.",
    category: "nature",
    difficulty: "hard",
    language: "english",
  },

  // Everyday Things
  {
    id: "fallback-everyday-1",
    word: "Umbrella",
    hint: "You open it up when the sky turns grey.",
    category: "everyday",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-everyday-2",
    word: "Backpack",
    hint: "Carried on your shoulders, usually to school or on a trip.",
    category: "everyday",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-everyday-3",
    word: "Toothbrush",
    hint: "Used twice a day as part of a daily routine.",
    category: "everyday",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-everyday-4",
    word: "Doorknob",
    hint: "You turn it every time you enter a room.",
    category: "everyday",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-everyday-5",
    word: "Thermostat",
    hint: "A small device that quietly controls comfort in a room.",
    category: "everyday",
    difficulty: "hard",
    language: "english",
  },
  {
    id: "fallback-everyday-6",
    word: "Stapler",
    hint: "A small desk tool that binds pages together.",
    category: "everyday",
    difficulty: "hard",
    language: "english",
  },

  // Technology
  {
    id: "fallback-technology-1",
    word: "Smartphone",
    hint: "Most people check this within minutes of waking up.",
    category: "technology",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-technology-2",
    word: "Drone",
    hint: "Flies without a pilot on board.",
    category: "technology",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-technology-3",
    word: "Router",
    hint: "A small box that quietly keeps a household connected.",
    category: "technology",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-technology-4",
    word: "Printer",
    hint: "Turns a digital file into something you can hold.",
    category: "technology",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-technology-5",
    word: "Microchip",
    hint: "Tiny, but it powers almost everything electronic.",
    category: "technology",
    difficulty: "hard",
    language: "english",
  },
  {
    id: "fallback-technology-6",
    word: "Hologram",
    hint: "A projection that appears to have real depth.",
    category: "technology",
    difficulty: "hard",
    language: "english",
  },

  // Places
  {
    id: "fallback-places-1",
    word: "Museum",
    hint: "A quiet building full of history and artifacts.",
    category: "places",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-places-2",
    word: "Airport",
    hint: "Where journeys begin and end, high above the clouds.",
    category: "places",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-places-3",
    word: "Lighthouse",
    hint: "Stands tall along the coast, guiding others at night.",
    category: "places",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-places-4",
    word: "Greenhouse",
    hint: "A glass structure that traps warmth for growing things.",
    category: "places",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-places-5",
    word: "Observatory",
    hint: "A building designed for looking far beyond the clouds.",
    category: "places",
    difficulty: "hard",
    language: "english",
  },
  {
    id: "fallback-places-6",
    word: "Catacombs",
    hint: "Winding underground passages with a long, quiet history.",
    category: "places",
    difficulty: "hard",
    language: "english",
  },

  // Random Objects
  {
    id: "fallback-objects-1",
    word: "Compass",
    hint: "Always points you in a reliable direction.",
    category: "objects",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-objects-2",
    word: "Anchor",
    hint: "Dropped to keep something from drifting away.",
    category: "objects",
    difficulty: "easy",
    language: "english",
  },
  {
    id: "fallback-objects-3",
    word: "Hourglass",
    hint: "Marks time by letting something fall slowly.",
    category: "objects",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-objects-4",
    word: "Telescope",
    hint: "Brings distant things dramatically closer.",
    category: "objects",
    difficulty: "medium",
    language: "english",
  },
  {
    id: "fallback-objects-5",
    word: "Chandelier",
    hint: "Hangs from above, catching the light in a room.",
    category: "objects",
    difficulty: "hard",
    language: "english",
  },
  {
    id: "fallback-objects-6",
    word: "Kaleidoscope",
    hint: "A twist of the hand rearranges its colorful patterns.",
    category: "objects",
    difficulty: "hard",
    language: "english",
  },

  // ---------------------------------------------------------------
  // Roman Urdu -- same category/difficulty grid as English above, so
  // offline Roman Urdu mode never has to relax category/difficulty
  // matching. Words are deliberately kept as common, natural terms
  // (mostly shared with the English list); only the hint is written
  // directly in natural Roman Urdu (Latin letters only).
  // ---------------------------------------------------------------
  // Food
  {
    id: "fallback-food-ur-1",
    word: "Pizza",
    hint: "Iske slice bana kar cheese ke sath khate hain.",
    category: "food",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-food-ur-2",
    word: "Burger",
    hint: "Do haathon se pakad kar khaya jata hai, bun ke beech mein.",
    category: "food",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-food-ur-3",
    word: "Sushi",
    hint: "Chawal aur machli ke chhote chhote tukdon wala Japani khana.",
    category: "food",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-food-ur-4",
    word: "Taco",
    hint: "Fold kiya hua khana jo chalte phirte khana asaan hota hai.",
    category: "food",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-food-ur-5",
    word: "Ceviche",
    hint: "Isme machli garmi se nahi balke khatte ras se 'pakti' hai.",
    category: "food",
    difficulty: "hard",
    language: "roman-urdu",
  },
  {
    id: "fallback-food-ur-6",
    word: "Tiramisu",
    hint: "Coffee mein bhigi hui layers wali ek meethi dish.",
    category: "food",
    difficulty: "hard",
    language: "roman-urdu",
  },

  // Animals
  {
    id: "fallback-animals-ur-1",
    word: "Elephant",
    hint: "Zameen ka sabse bada janwar, lambi sund ke sath.",
    category: "animals",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-animals-ur-2",
    word: "Dolphin",
    hint: "Pani mein khelta hua bohat samajhdar janwar.",
    category: "animals",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-animals-ur-3",
    word: "Penguin",
    hint: "Bohat sardi wali jagah mein rehta hai aur chal kar tairta hai.",
    category: "animals",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-animals-ur-4",
    word: "Chameleon",
    hint: "Apna rang badal kar aas paas mein chhup jata hai.",
    category: "animals",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-animals-ur-5",
    word: "Platypus",
    hint: "Anday deta hai lekin phir bhi mammal ginwaya jata hai.",
    category: "animals",
    difficulty: "hard",
    language: "roman-urdu",
  },
  {
    id: "fallback-animals-ur-6",
    word: "Okapi",
    hint: "Tangon par dhariyan hoti hain, lambi gardan wale janwar ka rishtedar.",
    category: "animals",
    difficulty: "hard",
    language: "roman-urdu",
  },

  // Sports
  {
    id: "fallback-sports-ur-1",
    word: "Football",
    hint: "Is game mein pair se ball ko kick karte hain.",
    category: "sports",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-sports-ur-2",
    word: "Basketball",
    hint: "Court par khela jata hai, dono taraf hoop hota hai.",
    category: "sports",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-sports-ur-3",
    word: "Tennis",
    hint: "Net ke dono taraf racket se ball maarte hain.",
    category: "sports",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-sports-ur-4",
    word: "Badminton",
    hint: "Ball ki jagah halka sa shuttle use hota hai.",
    category: "sports",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-sports-ur-5",
    word: "Curling",
    hint: "Players baraf par jhaadu se rasta saaf karte hain taake pathar sahi jagah pahunche.",
    category: "sports",
    difficulty: "hard",
    language: "roman-urdu",
  },
  {
    id: "fallback-sports-ur-6",
    word: "Sumo",
    hint: "Do bhari bharkam players ek doosre ko ring se bahar nikalne ki koshish karte hain.",
    category: "sports",
    difficulty: "hard",
    language: "roman-urdu",
  },

  // Movies
  {
    id: "fallback-movies-ur-1",
    word: "Sequel",
    hint: "Pehli kahani ke baad ane wala hissa.",
    category: "movies",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-movies-ur-2",
    word: "Trailer",
    hint: "Film se pehle dikhaya jane wala chhota sa preview.",
    category: "movies",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-movies-ur-3",
    word: "Soundtrack",
    hint: "Film ke scenes ke pichhe bajne wala music.",
    category: "movies",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-movies-ur-4",
    word: "Premiere",
    hint: "Kisi cheez ki sabse pehli public showing.",
    category: "movies",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-movies-ur-5",
    word: "Cameo",
    hint: "Kisi mashhoor shaks ki achanak aur chhoti si appearance.",
    category: "movies",
    difficulty: "hard",
    language: "roman-urdu",
  },
  {
    id: "fallback-movies-ur-6",
    word: "Anthology",
    hint: "Alag alag kahaniyon ka ek collection.",
    category: "movies",
    difficulty: "hard",
    language: "roman-urdu",
  },

  // Countries
  {
    id: "fallback-countries-ur-1",
    word: "Japan",
    hint: "Ye ek island mulk hai jahan bullet trains chalti hain.",
    category: "countries",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-countries-ur-2",
    word: "Brazil",
    hint: "Duniya ka sabse bada rainforest yahan paya jata hai.",
    category: "countries",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-countries-ur-3",
    word: "Canada",
    hint: "Maple syrup aur bohat thandi jagahon ke liye mashhoor mulk.",
    category: "countries",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-countries-ur-4",
    word: "Egypt",
    hint: "Purane zamane ke bade monuments ek dariya ke kinare milte hain.",
    category: "countries",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-countries-ur-5",
    word: "Iceland",
    hint: "Yahan geysers aur volcano wali zameen milti hai.",
    category: "countries",
    difficulty: "hard",
    language: "roman-urdu",
  },
  {
    id: "fallback-countries-ur-6",
    word: "Bhutan",
    hint: "Chhota sa Himalayan mulk jo logon ki khushi napta hai.",
    category: "countries",
    difficulty: "hard",
    language: "roman-urdu",
  },

  // Vehicles
  {
    id: "fallback-vehicles-ur-1",
    word: "Bicycle",
    hint: "Do pahiye, balance banate hue paidal chalate hain.",
    category: "vehicles",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-vehicles-ur-2",
    word: "Helicopter",
    hint: "Bina hilay ek hi jagah hawa mein ruk sakta hai.",
    category: "vehicles",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-vehicles-ur-3",
    word: "Submarine",
    hint: "Samundar ke andar bohat gehrai tak jata hai.",
    category: "vehicles",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-vehicles-ur-4",
    word: "Tractor",
    hint: "Khait mein bhari kaam ke liye istemal hota hai.",
    category: "vehicles",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-vehicles-ur-5",
    word: "Gondola",
    hint: "Nehron mein ek hi chappu se chalayi jati hai.",
    category: "vehicles",
    difficulty: "hard",
    language: "roman-urdu",
  },
  {
    id: "fallback-vehicles-ur-6",
    word: "Zeppelin",
    hint: "Bara sa airship jo pehle zamane mein logon ko safar karwata tha.",
    category: "vehicles",
    difficulty: "hard",
    language: "roman-urdu",
  },

  // Jobs
  {
    id: "fallback-jobs-ur-1",
    word: "Dentist",
    hint: "Daanton ka checkup karwane ke liye is doctor ke paas jate hain.",
    category: "jobs",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-jobs-ur-2",
    word: "Astronaut",
    hint: "Baadalon se bhi bohat upar jane ki training leta hai.",
    category: "jobs",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-jobs-ur-3",
    word: "Plumber",
    hint: "Pipe se pani leak ho to isko bulate hain.",
    category: "jobs",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-jobs-ur-4",
    word: "Librarian",
    hint: "Kitabon ke beech logon ki madad karta hai.",
    category: "jobs",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-jobs-ur-5",
    word: "Blacksmith",
    hint: "Aag aur hathoda se dhaatu ko shape deta hai.",
    category: "jobs",
    difficulty: "hard",
    language: "roman-urdu",
  },
  {
    id: "fallback-jobs-ur-6",
    word: "Cartographer",
    hint: "Iska kaam logon ko rasta dhoondne mein madad karna hai.",
    category: "jobs",
    difficulty: "hard",
    language: "roman-urdu",
  },

  // Nature
  {
    id: "fallback-nature-ur-1",
    word: "Waterfall",
    hint: "Pani upar se achanak neeche girta hai.",
    category: "nature",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-nature-ur-2",
    word: "Volcano",
    hint: "Salon tak khamosh rehta hai phir achanak phat jata hai.",
    category: "nature",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-nature-ur-3",
    word: "Glacier",
    hint: "Barf ka aik bada dher jo bohat aahista harakat karta hai.",
    category: "nature",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-nature-ur-4",
    word: "Meadow",
    hint: "Khula sabza maidan jahan phool khile hote hain.",
    category: "nature",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-nature-ur-5",
    word: "Coral Reef",
    hint: "Samundar ke andar rangeen jagah jo saalon mein banti hai.",
    category: "nature",
    difficulty: "hard",
    language: "roman-urdu",
  },
  {
    id: "fallback-nature-ur-6",
    word: "Geyser",
    hint: "Waqt par garam pani hawa mein uchalta hai.",
    category: "nature",
    difficulty: "hard",
    language: "roman-urdu",
  },

  // Everyday Things
  {
    id: "fallback-everyday-ur-1",
    word: "Umbrella",
    hint: "Barish mein isko sar ke upar rakhte hain.",
    category: "everyday",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-everyday-ur-2",
    word: "Backpack",
    hint: "Isay school mein istemal kiya jata hai, kandhon par utha kar.",
    category: "everyday",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-everyday-ur-3",
    word: "Toothbrush",
    hint: "Din mein do baar daant saaf karne ke liye istemal hota hai.",
    category: "everyday",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-everyday-ur-4",
    word: "Doorknob",
    hint: "Kamre mein jaate waqt ise ghumate hain.",
    category: "everyday",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-everyday-ur-5",
    word: "Thermostat",
    hint: "Chhota sa device jo kamre ka temperature khamoshi se control karta hai.",
    category: "everyday",
    difficulty: "hard",
    language: "roman-urdu",
  },
  {
    id: "fallback-everyday-ur-6",
    word: "Stapler",
    hint: "Table par rakha hua tool jo pages ko aapas mein jorta hai.",
    category: "everyday",
    difficulty: "hard",
    language: "roman-urdu",
  },

  // Technology
  {
    id: "fallback-technology-ur-1",
    word: "Smartphone",
    hint: "Neend se uthte hi zyada tar log sabse pehle ise check karte hain.",
    category: "technology",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-technology-ur-2",
    word: "Drone",
    hint: "Bina kisi pilot ke hawa mein udta hai.",
    category: "technology",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-technology-ur-3",
    word: "Router",
    hint: "Ghar mein internet connect rakhne wala chhota box.",
    category: "technology",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-technology-ur-4",
    word: "Printer",
    hint: "Isko kaam ya parhai ke liye kahin bhi le ja sakte hain, file ko kagaz par utaarta hai.",
    category: "technology",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-technology-ur-5",
    word: "Microchip",
    hint: "Chhota sa part jo taqreeban har electronic cheez ko chalata hai.",
    category: "technology",
    difficulty: "hard",
    language: "roman-urdu",
  },
  {
    id: "fallback-technology-ur-6",
    word: "Hologram",
    hint: "Aisi image jo hawa mein depth ke sath dikhai deti hai.",
    category: "technology",
    difficulty: "hard",
    language: "roman-urdu",
  },

  // Places
  {
    id: "fallback-places-ur-1",
    word: "Museum",
    hint: "Purani cheezon aur history se bhara ek building.",
    category: "places",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-places-ur-2",
    word: "Airport",
    hint: "Yahan se log safar shuru aur khatam karte hain.",
    category: "places",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-places-ur-3",
    word: "Lighthouse",
    hint: "Samundar ke kinare khada hokar raat mein rasta dikhata hai.",
    category: "places",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-places-ur-4",
    word: "Greenhouse",
    hint: "Sheeshe ki jagah jo paudon ke liye garmi rok kar rakhti hai.",
    category: "places",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-places-ur-5",
    word: "Observatory",
    hint: "Yahan se log bohat door aasman ko dekhte hain.",
    category: "places",
    difficulty: "hard",
    language: "roman-urdu",
  },
  {
    id: "fallback-places-ur-6",
    word: "Catacombs",
    hint: "Zameen ke neeche purani, ghumavdar sarangon wali jagah.",
    category: "places",
    difficulty: "hard",
    language: "roman-urdu",
  },

  // Random Objects
  {
    id: "fallback-objects-ur-1",
    word: "Compass",
    hint: "Ye hamesha sahi direction dikhata hai.",
    category: "objects",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-objects-ur-2",
    word: "Anchor",
    hint: "Cheez ko behne se rokne ke liye pani mein neeche giraya jata hai.",
    category: "objects",
    difficulty: "easy",
    language: "roman-urdu",
  },
  {
    id: "fallback-objects-ur-3",
    word: "Hourglass",
    hint: "Ret ke aahista girne se waqt ka andaza lagaya jata hai.",
    category: "objects",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-objects-ur-4",
    word: "Telescope",
    hint: "Isse photos jaisi door ki cheezein bilkul paas dikhai deti hain.",
    category: "objects",
    difficulty: "medium",
    language: "roman-urdu",
  },
  {
    id: "fallback-objects-ur-5",
    word: "Chandelier",
    hint: "Upar se latka hua roshni wala saaman.",
    category: "objects",
    difficulty: "hard",
    language: "roman-urdu",
  },
  {
    id: "fallback-objects-ur-6",
    word: "Kaleidoscope",
    hint: "Hath ghumane se iske andar rangeen patterns badal jate hain.",
    category: "objects",
    difficulty: "hard",
    language: "roman-urdu",
  },
];

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/**
 * Picks a random entry from the static fallback array, matching
 * category + difficulty + language as closely as possible via graceful
 * tiers:
 *
 *   1. Exact category + difficulty + language, excluding recently used
 *      words
 *   2. Exact category + difficulty + language (recent words allowed)
 *
 * `language` is matched exactly and never relaxed -- a Roman Urdu
 * selection must never silently fall back to an English entry (spec:
 * "LANGUAGE-AWARE WORD SELECTION" / "Do not silently fall back to
 * English if Roman Urdu was selected"). Both the English and Roman Urdu
 * blocks above cover the exact same category/difficulty grid, so in
 * practice this never needs to fall through further than tier 2.
 *
 * This function is synchronous and can never fail for a supported
 * language -- `FALLBACK_WORDS` is a non-empty compile-time constant
 * covering every real category/difficulty for both languages, so tier 2
 * always has something to return for a valid category/difficulty pair.
 */
export function getRandomFallbackWord(
  category: Category,
  difficulty: Difficulty,
  /** Defaults to "english" so pre-existing callers keep their exact
   * original behavior. */
  language: GameLanguage = "english",
): FallbackWordEntry {
  const isRandomCategory = category === "random";
  const matching = FALLBACK_WORDS.filter(
    (w) =>
      (isRandomCategory || w.category === category) &&
      w.difficulty === difficulty &&
      w.language === language,
  );

  if (matching.length === 0) {
    throw new Error(
      `No fallback word available for category "${category}", difficulty "${difficulty}", and language "${language}".`,
    );
  }

  const recentIds = new Set(getRecentWordIds());
  const nonRecent = matching.filter((w) => !recentIds.has(w.id));
  const pool = nonRecent.length > 0 ? nonRecent : matching;

  const entry = pickRandom(pool);
  rememberWordId(entry.id);

  return entry;
}
