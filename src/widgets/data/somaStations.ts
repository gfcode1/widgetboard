export interface SomaStation {
  slug: string
  name: string
  description: string
  genre: string
  streamUrl: string
}

export const SOMA_STATIONS: SomaStation[] = [
  {
    slug: 'groovesalad',
    name: 'Groove Salad',
    description: 'A nicely chilled plate of ambient/downtempo beats and grooves.',
    genre: 'ambient/electronic',
    streamUrl: 'https://ice6.somafm.com/groovesalad-128-mp3',
  },
  {
    slug: 'dronezone',
    name: 'Drone Zone',
    description:
      'Served best chilled, safe with most medications. Atmospheric textures with minimal beats.',
    genre: 'ambient',
    streamUrl: 'https://ice6.somafm.com/dronezone-128-mp3',
  },
  {
    slug: 'deepspaceone',
    name: 'Deep Space One',
    description:
      'Deep ambient electronic, experimental and space music. For inner and outer space exploration.',
    genre: 'ambient/electronic',
    streamUrl: 'https://ice6.somafm.com/deepspaceone-128-mp3',
  },
  {
    slug: 'spacestation',
    name: 'Space Station Soma',
    description: 'Tune in, turn on, space out. Spaced-out ambient and mid-tempo electronica.',
    genre: 'ambient/electronic',
    streamUrl: 'https://ice2.somafm.com/spacestation-128-mp3',
  },
  {
    slug: 'indiepop',
    name: 'Indie Pop Rocks!',
    description: 'New and classic favorite indie pop tracks.',
    genre: 'alternative/rock',
    streamUrl: 'https://ice2.somafm.com/indiepop-128-mp3',
  },
  {
    slug: 'gsclassic',
    name: 'Groove Salad Classic',
    description:
      'The classic (early 2000s) version of a nicely chilled plate of ambient/downtempo beats and grooves.',
    genre: 'ambient/electronic',
    streamUrl: 'https://ice2.somafm.com/gsclassic-128-mp3',
  },
  {
    slug: 'lush',
    name: 'Lush',
    description: 'Sensuous and mellow female vocals, many with an electronic influence.',
    genre: 'electronic',
    streamUrl: 'https://ice2.somafm.com/lush-128-mp3',
  },
  {
    slug: 'synphaera',
    name: 'Synphaera Radio',
    description: 'Modern electronic ambient and space music from an independent record label.',
    genre: 'ambient/electronic',
    streamUrl: 'https://ice2.somafm.com/synphaera-128-mp3',
  },
  {
    slug: 'secretagent',
    name: 'Secret Agent',
    description:
      'The soundtrack for your stylish, mysterious, dangerous life. For Spies and PIs too!',
    genre: 'lounge',
    streamUrl: 'https://ice2.somafm.com/secretagent-128-mp3',
  },
  {
    slug: 'seventies',
    name: 'Left Coast 70s',
    description: 'Mellow album rock from the Seventies. Yacht not required.',
    genre: '70s/rock',
    streamUrl: 'https://ice2.somafm.com/seventies-128-mp3',
  },
  {
    slug: 'u80s',
    name: 'Underground 80s',
    description: 'Early 80s UK Synthpop and a bit of New Wave.',
    genre: 'alternative/electronic',
    streamUrl: 'https://ice2.somafm.com/u80s-128-mp3',
  },
  {
    slug: 'defcon',
    name: 'DEF CON Radio',
    description: 'Music for Hacking. The DEF CON Year-Round Channel.',
    genre: 'electronic/specials',
    streamUrl: 'https://ice2.somafm.com/defcon-128-mp3',
  },
  {
    slug: 'darkzone',
    name: 'The Dark Zone',
    description: 'The darker side of deep ambient. Music for staring into the Abyss.',
    genre: 'ambient',
    streamUrl: 'https://ice2.somafm.com/darkzone-128-mp3',
  },
  {
    slug: 'beatblender',
    name: 'Beat Blender',
    description: 'A late night blend of deep-house and downtempo chill.',
    genre: 'electronic',
    streamUrl: 'https://ice2.somafm.com/beatblender-128-mp3',
  },
  {
    slug: 'groovesalad2',
    name: 'Groove Salad 2',
    description: 'A different mix of nicely chilled ambient/downtempo beats and grooves.',
    genre: 'ambient/electronic',
    streamUrl: 'https://ice2.somafm.com/groovesalad2-128-mp3',
  },
  {
    slug: 'folkfwd',
    name: 'Folk Forward',
    description: 'Indie Folk, Alt-folk and the occasional folk classics.',
    genre: 'folk/alternative',
    streamUrl: 'https://ice2.somafm.com/folkfwd-128-mp3',
  },
  {
    slug: 'thetrip',
    name: 'The Trip',
    description: 'Progressive house / trance. Tip top tunes.',
    genre: 'electronic',
    streamUrl: 'https://ice2.somafm.com/thetrip-128-mp3',
  },
  {
    slug: 'bossa',
    name: 'Bossa Beyond',
    description: 'Silky-smooth, laid-back Brazilian-style rhythms of Bossa Nova, Samba and beyond.',
    genre: 'bossanova/world',
    streamUrl: 'https://ice2.somafm.com/bossa-128-mp3',
  },
  {
    slug: 'bootliquor',
    name: 'Boot Liquor',
    description: 'Americana Roots music for Cowhands, Cowpokes and Cowtippers.',
    genre: 'americana',
    streamUrl: 'https://ice2.somafm.com/bootliquor-128-mp3',
  },
  {
    slug: 'poptron',
    name: 'PopTron',
    description: 'Electropop and indie dance rock with sparkle and pop.',
    genre: 'alternative',
    streamUrl: 'https://ice2.somafm.com/poptron-128-mp3',
  },
  {
    slug: 'suburbsofgoa',
    name: 'Suburbs of Goa',
    description: 'Desi-influenced Asian world beats and beyond.',
    genre: 'world',
    streamUrl: 'https://ice2.somafm.com/suburbsofgoa-128-mp3',
  },
  {
    slug: 'fluid',
    name: 'Fluid',
    description:
      'Drown in the electronic sound of instrumental hiphop, future soul and liquid trap.',
    genre: 'electronic/hiphop',
    streamUrl: 'https://ice2.somafm.com/fluid-128-mp3',
  },
  {
    slug: 'reggae',
    name: 'Heavyweight Reggae',
    description: 'Reggae, Ska, Rocksteady classic and deep tracks.',
    genre: 'reggae',
    streamUrl: 'https://ice2.somafm.com/reggae-128-mp3',
  },
  {
    slug: '7soul',
    name: 'Seven Inch Soul',
    description: 'Vintage soul tracks from the original 45 RPM vinyl.',
    genre: 'oldies',
    streamUrl: 'https://ice2.somafm.com/7soul-128-mp3',
  },
  {
    slug: 'sonicuniverse',
    name: 'Sonic Universe',
    description: 'Transcending the world of jazz with eclectic, avant-garde takes on tradition.',
    genre: 'jazz',
    streamUrl: 'https://ice2.somafm.com/sonicuniverse-128-mp3',
  },
  {
    slug: 'illstreet',
    name: 'Illinois Street Lounge',
    description: 'Classic bachelor pad, playful exotica and vintage music of tomorrow.',
    genre: 'lounge',
    streamUrl: 'https://ice2.somafm.com/illstreet-128-mp3',
  },
  {
    slug: 'thistle',
    name: 'ThistleRadio',
    description: 'Exploring music from Celtic roots and branches.',
    genre: 'celtic/world',
    streamUrl: 'https://ice2.somafm.com/thistle-128-mp3',
  },
  {
    slug: 'dz2',
    name: 'Drone Zone 2',
    description: 'A more eclectic alternative mix of atmospheric textures with minimal beats.',
    genre: 'ambient',
    streamUrl: 'https://ice2.somafm.com/dz2-128-mp3',
  },
  {
    slug: 'vaporwaves',
    name: 'Vaporwaves',
    description: 'All Vaporwave. All the time.',
    genre: 'electronic',
    streamUrl: 'https://ice2.somafm.com/vaporwaves-128-mp3',
  },
  {
    slug: 'cliqhop',
    name: 'cliqhop idm',
    description: "Blips'n'beeps backed mostly w/beats. Intelligent Dance Music.",
    genre: 'electronic',
    streamUrl: 'https://ice2.somafm.com/cliqhop-128-mp3',
  },
  {
    slug: 'missioncontrol',
    name: 'Mission Control',
    description: 'Celebrating NASA and Space Explorers everywhere.',
    genre: 'ambient/electronic',
    streamUrl: 'https://ice2.somafm.com/missioncontrol-128-mp3',
  },
  {
    slug: 'metal',
    name: 'Metal Detector',
    description:
      'From black to doom, prog to sludge, thrash to post, stoner to crossover, punk to industrial.',
    genre: 'metal',
    streamUrl: 'https://ice2.somafm.com/metal-128-mp3',
  },
  {
    slug: 'digitalis',
    name: 'Digitalis',
    description: 'Digitally affected analog rock to calm the agitated heart.',
    genre: 'electronic/alternative',
    streamUrl: 'https://ice2.somafm.com/digitalis-128-mp3',
  },
  {
    slug: 'tikitime',
    name: 'Tiki Time',
    description: 'Classic Tiki music and Vintage island rhythms to sip cocktails by.',
    genre: 'tiki/world',
    streamUrl: 'https://ice2.somafm.com/tikitime-128-mp3',
  },
  {
    slug: 'dubstep',
    name: 'Dub Step Beyond',
    description: 'Dubstep, Dub and Deep Bass. May damage speakers at high volume.',
    genre: 'electronic',
    streamUrl: 'https://ice2.somafm.com/dubstep-128-mp3',
  },
  {
    slug: 'sf1033',
    name: 'SF 10-33',
    description:
      'Ambient music mixed with the sounds of San Francisco public safety radio traffic.',
    genre: 'ambient/news',
    streamUrl: 'https://ice2.somafm.com/sf1033-128-mp3',
  },
  {
    slug: 'covers',
    name: 'Covers',
    description: "Just covers. Songs you know by artists you don't. We've got you covered.",
    genre: 'eclectic',
    streamUrl: 'https://ice2.somafm.com/covers-128-mp3',
  },
  {
    slug: 'brfm',
    name: 'Black Rock FM',
    description: 'From the Black Rock Desert playa to the world, year round!',
    genre: 'eclectic',
    streamUrl: 'https://ice2.somafm.com/brfm-128-mp3',
  },
  {
    slug: 'scanner',
    name: 'SF Police Scanner',
    description: 'San Francisco Public Safety Scanner Feed.',
    genre: 'live/news',
    streamUrl: 'https://ice2.somafm.com/scanner-128-mp3',
  },
  {
    slug: 'n5md',
    name: 'n5MD Radio',
    description:
      'Emotional Experiments in Music: Ambient, modern composition, post-rock, & experimental electronic.',
    genre: 'specials',
    streamUrl: 'https://ice2.somafm.com/n5md-128-mp3',
  },
  {
    slug: 'specials',
    name: 'SomaFM Specials',
    description: 'Now featuring Afternoon Jazz, Wavepool, DubX, The Surf Report & More!',
    genre: 'specials',
    streamUrl: 'https://ice2.somafm.com/specials-128-mp3',
  },
  {
    slug: 'live',
    name: 'SomaFM Live',
    description: 'Special Live Events and rebroadcasts of past live events.',
    genre: 'live/specials',
    streamUrl: 'https://ice2.somafm.com/live-128-mp3',
  },
  {
    slug: 'insound',
    name: 'The In-Sound',
    description: '60s/70s Hipster Euro Pop where psychedelic melodies meets groovy vibes.',
    genre: 'pop/oldies',
    streamUrl: 'https://ice2.somafm.com/insound-128-mp3',
  },
  {
    slug: 'doomed',
    name: 'Doomed',
    description: 'Where every day is Halloween: Dark industrial/ambient music for tortured souls.',
    genre: 'ambient/industrial',
    streamUrl: 'https://ice2.somafm.com/doomed-128-mp3',
  },
  {
    slug: 'chillits',
    name: 'Chillits Radio',
    description: 'Celebrating 25 years of music, chilling and camping.',
    genre: 'chill/live',
    streamUrl: 'https://ice2.somafm.com/chillits-128-mp3',
  },
  {
    slug: 'sfinsf',
    name: 'SF in SF',
    description:
      'Author readings and discussions from the science fiction, fantasy, horror, and genre literary fields.',
    genre: 'spoken',
    streamUrl: 'https://ice2.somafm.com/sfinsf-128-mp3',
  },
]

export function getStationBySlug(slug: string): SomaStation | undefined {
  return SOMA_STATIONS.find((s) => s.slug === slug)
}
