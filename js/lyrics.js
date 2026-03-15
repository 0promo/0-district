/* ═══════════════════════════════════════════════════════════════
   0 DISTRICT — SYNCED LYRICS ENGINE
   Timed lyrics for all 12 tracks. Format: { time: seconds, text: '' }
   Empty text = instrumental break (shown as ···)
   ═══════════════════════════════════════════════════════════════ */

var LYRICS_DATA = {

  't1': { /* Accra Nights — Kofi Manu — 3:47 */
    title: 'ACCRA NIGHTS', artist: 'KOFI MANU',
    lines: [
      { t:0,   text:'' },
      { t:6,   text:'City lights reflecting on the Volta' },
      { t:11,  text:'Moving through the night, feeling bolder' },
      { t:16,  text:'Every drum beat echoes through the road' },
      { t:21,  text:'Ancient rhythm carrying the load' },
      { t:26,  text:'' },
      { t:30,  text:'Accra nights — the city comes alive' },
      { t:35,  text:'Every beat we breathe, helping us survive' },
      { t:40,  text:'From the north shore down to the south' },
      { t:45,  text:'These words of fire come straight from the mouth' },
      { t:50,  text:'' },
      { t:55,  text:'0 District signal, strong and clear' },
      { t:60,  text:'Every frequency you need to hear' },
      { t:65,  text:'Accra nights we living in the glow' },
      { t:70,  text:'Continental music, let it flow' },
      { t:75,  text:'' },
      { t:82,  text:'Accra nights — Accra nights' },
      { t:87,  text:'Feel the rhythm, feel the lights' },
      { t:92,  text:'Accra nights — forever mine' },
      { t:97,  text:'District music, so divine' },
      { t:102, text:'' },
      { t:110, text:'Streets of Osu calling my name' },
      { t:115, text:'Labadi beach, forever the same' },
      { t:120, text:'Independence Arch standing tall' },
      { t:125, text:'0 District answering the call' },
      { t:130, text:'' },
      { t:138, text:'Accra nights — the city comes alive' },
      { t:143, text:'Every beat we breathe, helping us survive' },
      { t:148, text:'From the north shore down to the south' },
      { t:153, text:'These words of fire come straight from the mouth' },
      { t:158, text:'' },
      { t:165, text:'0 District signal, strong and clear' },
      { t:170, text:'Every frequency you need to hear' },
      { t:175, text:'Accra nights we living in the glow' },
      { t:180, text:'Continental music, let it flow' },
      { t:185, text:'' },
      { t:195, text:'Accra nights — Accra nights' },
      { t:200, text:'Feel the rhythm, feel the lights' },
      { t:210, text:'Fade into the district night' },
      { t:215, text:'Accra city, burning bright' },
      { t:220, text:'' },
      { t:224, text:'· · ·' }
    ]
  },

  't2': { /* Dakar Frequency — DJ Senegal — 4:12 */
    title: 'DAKAR FREQUENCY', artist: 'DJ SENEGAL',
    lines: [
      { t:0,   text:'' },
      { t:8,   text:'Across the ocean, frequencies align' },
      { t:14,  text:'Atlantic wave, your signal meets with mine' },
      { t:20,  text:'Teranga spirit woven in the bass' },
      { t:26,  text:'Dakar sending signal into space' },
      { t:32,  text:'' },
      { t:38,  text:'Dakar frequency — lock in' },
      { t:43,  text:'Bass line heavy, let the music win' },
      { t:48,  text:'Four to the floor, the groove is spreading wide' },
      { t:54,  text:'West Africa rolling with the tide' },
      { t:60,  text:'' },
      { t:68,  text:'From Plateau to the Médina' },
      { t:74,  text:'This frequency getting cleaner' },
      { t:80,  text:'Ile de Gorée in the background fade' },
      { t:86,  text:'History and future overlaid' },
      { t:92,  text:'' },
      { t:100, text:'Dakar frequency — lock in' },
      { t:105, text:'Bass line heavy, let the music win' },
      { t:110, text:'Four to the floor, the groove is spreading wide' },
      { t:116, text:'West Africa rolling with the tide' },
      { t:122, text:'' },
      { t:132, text:'Signal breaking through the static noise' },
      { t:138, text:'Sabar drums giving Dakar voice' },
      { t:144, text:'Kora melody beneath the beat' },
      { t:150, text:'District signal making it complete' },
      { t:156, text:'' },
      { t:165, text:'Dakar frequency — lock in' },
      { t:170, text:'Bass line heavy, let the music win' },
      { t:176, text:'Four to the floor, the groove is spreading wide' },
      { t:182, text:'West Africa rolling with the tide' },
      { t:188, text:'' },
      { t:196, text:'Fade in — fade out — frequency' },
      { t:202, text:'Teranga running through the sound' },
      { t:208, text:'Dakar frequency going round' },
      { t:214, text:'· · ·' },
      { t:248, text:'· · ·' }
    ]
  },

  't3': { /* Lagos Ritual — Zara.B — 3:28 */
    title: 'LAGOS RITUAL', artist: 'ZARA.B',
    lines: [
      { t:0,   text:'' },
      { t:5,   text:'Before the sun breaks over Lagos Bay' },
      { t:10,  text:'I make my offering, I kneel and pray' },
      { t:15,  text:'Ancient ritual in a modern frame' },
      { t:20,  text:'My ancestors and I — we share one name' },
      { t:25,  text:'' },
      { t:30,  text:'Lagos ritual, the blood remembers' },
      { t:35,  text:'Through the neon haze and burning embers' },
      { t:40,  text:'Every song I sing is a ceremony' },
      { t:45,  text:'0 District witnesses my testimony' },
      { t:50,  text:'' },
      { t:58,  text:'Victoria Island at the crack of dawn' },
      { t:63,  text:'Lekki highway, moving on and on' },
      { t:68,  text:'Eko Atlantic rising from the sea' },
      { t:73,  text:'But this ritual stays deep inside of me' },
      { t:78,  text:'' },
      { t:84,  text:'Lagos ritual, the blood remembers' },
      { t:89,  text:'Through the neon haze and burning embers' },
      { t:94,  text:'Every song I sing is a ceremony' },
      { t:99,  text:'0 District witnesses my testimony' },
      { t:104, text:'' },
      { t:112, text:'I mix the old ways with the new sound' },
      { t:117, text:'Griot stories running underground' },
      { t:122, text:'Yoruba tongue beneath the 808' },
      { t:127, text:'Lagos ritual — this is what I create' },
      { t:132, text:'' },
      { t:140, text:'Lagos ritual, the blood remembers' },
      { t:145, text:'Through the neon haze and burning embers' },
      { t:150, text:'Every song I sing is a ceremony' },
      { t:155, text:'0 District witnesses my testimony' },
      { t:162, text:'' },
      { t:170, text:'The ritual never ends' },
      { t:175, text:'Through every beat it transcends' },
      { t:180, text:'Lagos, Lagos — my soul' },
      { t:185, text:'This music makes me whole' },
      { t:195, text:'· · ·' },
      { t:206, text:'· · ·' }
    ]
  },

  't4': { /* Midnight Lagos — Ofo Beats — 4:55 */
    title: 'MIDNIGHT LAGOS', artist: 'OFO BEATS',
    lines: [
      { t:0,   text:'' },
      { t:10,  text:'When the clock strikes twelve on the mainland' },
      { t:16,  text:'Danfo buses gone, nothing as planned' },
      { t:22,  text:'Generator hum replaces city noise' },
      { t:28,  text:'Midnight Lagos — this is our choice' },
      { t:34,  text:'' },
      { t:42,  text:'We move through the darkness, we know the way' },
      { t:48,  text:'Tomorrow belongs to those who grind today' },
      { t:54,  text:'Okada riders on the empty road' },
      { t:60,  text:'Midnight Lagos carrying the load' },
      { t:66,  text:'' },
      { t:74,  text:'Beat drops heavy at the midnight hour' },
      { t:80,  text:'Lagos skyline showing all its power' },
      { t:86,  text:'Third Mainland Bridge lit up in the black' },
      { t:92,  text:'Midnight Lagos — no way turning back' },
      { t:98,  text:'' },
      { t:108, text:'Suya smoke rising in the air' },
      { t:114, text:'Afrobeats playing everywhere' },
      { t:120, text:'From Surulere to Mushin far' },
      { t:126, text:'Midnight Lagos is who we are' },
      { t:132, text:'' },
      { t:142, text:'Beat drops heavy at the midnight hour' },
      { t:148, text:'Lagos skyline showing all its power' },
      { t:154, text:'Third Mainland Bridge lit up in the black' },
      { t:160, text:'Midnight Lagos — no way turning back' },
      { t:166, text:'' },
      { t:178, text:'0 District broadcasting the night' },
      { t:184, text:'Every frequency burning bright' },
      { t:190, text:'Lagos midnight, Lagos midnight' },
      { t:196, text:'District signal, burning light' },
      { t:202, text:'' },
      { t:212, text:'Beat drops heavy at the midnight hour' },
      { t:218, text:'Lagos skyline showing all its power' },
      { t:224, text:'Third Mainland Bridge lit up in the black' },
      { t:230, text:'Midnight Lagos — no way turning back' },
      { t:236, text:'' },
      { t:248, text:'Lagos... Lagos... Lagos...' },
      { t:255, text:'Midnight... midnight...' },
      { t:270, text:'· · ·' },
      { t:292, text:'· · ·' }
    ]
  },

  't5': { /* Joburg Grid — Echo Delta — 5:01 */
    title: 'JOBURG GRID', artist: 'ECHO DELTA',
    lines: [
      { t:0,   text:'' },
      { t:10,  text:'Street grid of the city of gold' },
      { t:16,  text:'New story replacing the old' },
      { t:22,  text:'Sandton rising, Soweto soul' },
      { t:28,  text:'Joburg grid making us whole' },
      { t:34,  text:'' },
      { t:44,  text:'Electronic pulse through the highveld air' },
      { t:50,  text:'808 rolling everywhere' },
      { t:56,  text:'From Rosebank to Alex, signal strong' },
      { t:62,  text:'Joburg grid playing our song' },
      { t:68,  text:'' },
      { t:78,  text:'City of gold, city of sound' },
      { t:84,  text:'0 District frequencies found' },
      { t:90,  text:'Johannesburg grid locked in time' },
      { t:96,  text:'Every beat and every rhyme' },
      { t:102, text:'' },
      { t:114, text:'Maboneng quarter lights at night' },
      { t:120, text:'Constitution Hill burning bright' },
      { t:126, text:'Echo Delta transmitting clear' },
      { t:132, text:'The Joburg grid is what you hear' },
      { t:138, text:'' },
      { t:150, text:'City of gold, city of sound' },
      { t:156, text:'0 District frequencies found' },
      { t:162, text:'Johannesburg grid locked in time' },
      { t:168, text:'Every beat and every rhyme' },
      { t:174, text:'' },
      { t:186, text:'Synthesizer cutting through the smog' },
      { t:192, text:'Joburg rhythm breaking through the fog' },
      { t:198, text:'Grid expanding, signal multiplied' },
      { t:204, text:'Continental sound — amplified' },
      { t:210, text:'' },
      { t:222, text:'City of gold, city of sound' },
      { t:228, text:'0 District frequencies found' },
      { t:234, text:'Johannesburg grid locked in time' },
      { t:240, text:'Every beat and every rhyme' },
      { t:246, text:'' },
      { t:258, text:'Joburg grid... Joburg grid...' },
      { t:270, text:'Echo Delta... signing off...' },
      { t:286, text:'· · ·' },
      { t:298, text:'· · ·' }
    ]
  },

  't6': { /* Nairobi Rise — Yemi.K — 3:33 */
    title: 'NAIROBI RISE', artist: 'YEMI.K',
    lines: [
      { t:0,   text:'' },
      { t:6,   text:'Before the matatu starts its run' },
      { t:11,  text:'Nairobi waking under morning sun' },
      { t:16,  text:'Silicon Savannah in my veins' },
      { t:21,  text:'East Africa running through my brain' },
      { t:26,  text:'' },
      { t:32,  text:'Nairobi rise — we are ascending' },
      { t:37,  text:'Every bar, every verse is unending' },
      { t:42,  text:'From Kibera to Karen on the hill' },
      { t:47,  text:'Nairobi rising, rising still' },
      { t:52,  text:'' },
      { t:60,  text:'Uhuru Park glowing in the haze' },
      { t:65,  text:'Nairobi city burning in a blaze' },
      { t:70,  text:'Karibu — welcome to the sound' },
      { t:75,  text:'East African rhythm turning round' },
      { t:80,  text:'' },
      { t:88,  text:'Nairobi rise — we are ascending' },
      { t:93,  text:'Every bar, every verse is unending' },
      { t:98,  text:'From Kibera to Karen on the hill' },
      { t:103, text:'Nairobi rising, rising still' },
      { t:108, text:'' },
      { t:116, text:'0 District signal from the Rift' },
      { t:121, text:'East Africa giving music lift' },
      { t:126, text:'Nairobi rise, the continent calls' },
      { t:131, text:'District music breaking through the walls' },
      { t:136, text:'' },
      { t:144, text:'Nairobi rise — we are ascending' },
      { t:149, text:'Every bar, every verse is unending' },
      { t:154, text:'From Kibera to Karen on the hill' },
      { t:159, text:'Nairobi rising, rising still' },
      { t:166, text:'' },
      { t:176, text:'Rise... rise... Nairobi' },
      { t:182, text:'East Africa — forever free' },
      { t:198, text:'· · ·' },
      { t:210, text:'· · ·' }
    ]
  },

  't7': { /* Afro Pulse — Amara X Pulse — 4:08 */
    title: 'AFRO PULSE', artist: 'AMARA X PULSE',
    lines: [
      { t:0,   text:'' },
      { t:7,   text:'Feel the pulse, feel the pulse of Africa' },
      { t:13,  text:'From the Atlas down to the Cape — spectacular' },
      { t:19,  text:'54 nations, one heartbeat' },
      { t:25,  text:'Afro Pulse making it complete' },
      { t:31,  text:'' },
      { t:38,  text:'Abidjan rhythm, Accra soul' },
      { t:44,  text:'Lagos fire making us whole' },
      { t:50,  text:'Nairobi signal, Joburg grid' },
      { t:56,  text:'This is what our parents did' },
      { t:62,  text:'' },
      { t:70,  text:'Afro Pulse — the continent is speaking' },
      { t:76,  text:'Every frequency that we have been seeking' },
      { t:82,  text:'From east to west the rhythm is the same' },
      { t:88,  text:'0 District — we are playing the game' },
      { t:94,  text:'' },
      { t:104, text:'Djembé call from the western plains' },
      { t:110, text:'Marimba notes like the Abidjan rains' },
      { t:116, text:'Griot voices in the synthesizer' },
      { t:122, text:'Afro Pulse making it wiser' },
      { t:128, text:'' },
      { t:136, text:'Afro Pulse — the continent is speaking' },
      { t:142, text:'Every frequency that we have been seeking' },
      { t:148, text:'From east to west the rhythm is the same' },
      { t:154, text:'0 District — we are playing the game' },
      { t:160, text:'' },
      { t:170, text:'One pulse — one Africa — one sound' },
      { t:176, text:'From the mountains to the underground' },
      { t:182, text:'Afro Pulse never stops' },
      { t:188, text:'District signal never drops' },
      { t:194, text:'' },
      { t:202, text:'Feel the pulse... feel the pulse...' },
      { t:212, text:'Africa — forever the source' },
      { t:224, text:'· · ·' },
      { t:245, text:'· · ·' }
    ]
  },

  't8': { /* Nile Blue — Cairo Sound — 3:52 */
    title: 'NILE BLUE', artist: 'CAIRO SOUND',
    lines: [
      { t:0,   text:'' },
      { t:7,   text:'Five thousand years flow through this channel' },
      { t:13,  text:'Ancient voices on a modern panel' },
      { t:19,  text:'Nile Blue — the colour of the source' },
      { t:25,  text:'Cairo Sound — we are on course' },
      { t:31,  text:'' },
      { t:38,  text:'Pyramid geometry in the rhythm' },
      { t:44,  text:'Pharaonic frequency — give them' },
      { t:50,  text:'Something they have never heard before' },
      { t:56,  text:'Nile Blue washing up the shore' },
      { t:62,  text:'' },
      { t:70,  text:'From Alexandria down to Aswan' },
      { t:76,  text:'Cairo Signal carrying on and on' },
      { t:82,  text:'Nile Blue in the synthesizer wave' },
      { t:88,  text:'Ancient wisdom that we have to save' },
      { t:94,  text:'' },
      { t:102, text:'Nile Blue — the signal from the north' },
      { t:108, text:'0 District bringing it forth' },
      { t:114, text:'Mediterranean meeting the Red Sea' },
      { t:120, text:'Cairo Sound — that is what we be' },
      { t:126, text:'' },
      { t:136, text:'Electronic Oud beneath the beat' },
      { t:142, text:'Tabla rolling making it complete' },
      { t:148, text:'North Africa answering the call' },
      { t:154, text:'Nile Blue connecting us all' },
      { t:160, text:'' },
      { t:170, text:'Nile Blue... Nile Blue...' },
      { t:178, text:'Ancient river running through' },
      { t:186, text:'Cairo Sound — forever true' },
      { t:200, text:'· · ·' },
      { t:228, text:'· · ·' }
    ]
  },

  't9': { /* Third Wave — Pulse Network — 6:14 */
    title: 'THIRD WAVE', artist: 'PULSE NETWORK',
    lines: [
      { t:0,   text:'' },
      { t:10,  text:'First wave came from the west' },
      { t:17,  text:'Second wave put us to the test' },
      { t:24,  text:'Third wave rising from the Congo soil' },
      { t:31,  text:'Kinshasa amapiano — this is our toil' },
      { t:38,  text:'' },
      { t:48,  text:'Piano keys rolling through the Brazzaville air' },
      { t:55,  text:'Third wave signal — everybody stare' },
      { t:62,  text:'From Gombe to Limete the log drum beats' },
      { t:69,  text:'Congo River flowing through the streets' },
      { t:76,  text:'' },
      { t:88,  text:'Third wave — this is the third wave' },
      { t:95,  text:'Kinshasa music — something to save' },
      { t:102, text:'Piano patterns locked in the groove' },
      { t:109, text:'Third wave — find your move' },
      { t:116, text:'' },
      { t:130, text:'Soukous legacy beneath the new sound' },
      { t:137, text:'Congo rhythm running underground' },
      { t:144, text:'Ndombolo footwork in the piano line' },
      { t:151, text:'Third wave rising — everything is fine' },
      { t:158, text:'' },
      { t:170, text:'Third wave — this is the third wave' },
      { t:177, text:'Kinshasa music — something to save' },
      { t:184, text:'Piano patterns locked in the groove' },
      { t:191, text:'Third wave — find your move' },
      { t:198, text:'' },
      { t:212, text:'0 District receiving the signal' },
      { t:219, text:'Third wave final — third wave final' },
      { t:226, text:'Congo Basin through the speaker wire' },
      { t:233, text:'Third wave burning like a fire' },
      { t:240, text:'' },
      { t:254, text:'Third wave — this is the third wave' },
      { t:261, text:'Kinshasa music — something to save' },
      { t:268, text:'Piano patterns locked in the groove' },
      { t:275, text:'Third wave — find your move' },
      { t:282, text:'' },
      { t:296, text:'Third wave... Congo...Kinshasa...' },
      { t:310, text:'Piano... piano... piano...' },
      { t:340, text:'· · ·' },
      { t:370, text:'· · ·' }
    ]
  },

  't10': { /* Signal Void — Freq District — 4:44 */
    title: 'SIGNAL VOID', artist: 'FREQ DISTRICT',
    lines: [
      { t:0,   text:'' },
      { t:8,   text:'Somewhere between the signal and the static' },
      { t:15,  text:'I found a space — dramatic and emphatic' },
      { t:22,  text:'Nairobi transmission in the void' },
      { t:29,  text:'Freq District signal — unalloyed' },
      { t:36,  text:'' },
      { t:46,  text:'No carrier — no destination' },
      { t:53,  text:'Pure frequency — pure sensation' },
      { t:60,  text:'Signal void where the music lives' },
      { t:67,  text:'Everything the void gives' },
      { t:74,  text:'' },
      { t:84,  text:'Modular synthesizer in the ether' },
      { t:91,  text:'Freq District — signal believer' },
      { t:98,  text:'Through the void the transmission bends' },
      { t:105, text:'Signal void — where the music ends' },
      { t:112, text:'' },
      { t:124, text:'Atmospheric pressure in the low end' },
      { t:131, text:'0 District signal — no dead end' },
      { t:138, text:'Arpeggiated patterns in the noise' },
      { t:145, text:'Freq District — finding the voice' },
      { t:152, text:'' },
      { t:164, text:'Signal void — empty but full' },
      { t:171, text:'Freq District — pull after pull' },
      { t:178, text:'Through the void a melody appears' },
      { t:185, text:'Signal void — music that clears' },
      { t:192, text:'' },
      { t:206, text:'Void... signal... void... signal...' },
      { t:218, text:'Freq District going offline' },
      { t:232, text:'· · ·' },
      { t:264, text:'· · ·' },
      { t:280, text:'· · ·' }
    ]
  },

  't11': { /* Gold Shore — Tema Coast — 3:19 */
    title: 'GOLD SHORE', artist: 'TEMA COAST',
    lines: [
      { t:0,   text:'' },
      { t:5,   text:'Gold Coast whispers in the harmattan wind' },
      { t:10,  text:'Highlife legacy — where it all begins' },
      { t:15,  text:'Tema harbour sending out the call' },
      { t:20,  text:'Gold Shore — there\'s music for us all' },
      { t:25,  text:'' },
      { t:30,  text:'Guitar strings plucked in the afternoon heat' },
      { t:35,  text:'Highlife horns and the talking drum beat' },
      { t:40,  text:'E.T. Mensah echoing today' },
      { t:45,  text:'Gold Shore — we honour the way' },
      { t:50,  text:'' },
      { t:56,  text:'Gold Shore — the music never left' },
      { t:61,  text:'Through every wave we held the cleft' },
      { t:66,  text:'From Kumasi down to Tema Coast' },
      { t:71,  text:'Gold Shore — this is what we love most' },
      { t:76,  text:'' },
      { t:82,  text:'Cape Coast castle in the setting sun' },
      { t:87,  text:'Gold Shore music — never done' },
      { t:92,  text:'Highlife woven into hip-hop lace' },
      { t:97,  text:'Ghana showing every other place' },
      { t:102, text:'' },
      { t:108, text:'Gold Shore — the music never left' },
      { t:113, text:'Through every wave we held the cleft' },
      { t:118, text:'From Kumasi down to Tema Coast' },
      { t:123, text:'Gold Shore — this is what we love most' },
      { t:128, text:'' },
      { t:136, text:'Highlife... Gold Shore...' },
      { t:142, text:'Ghana forever on the shore' },
      { t:155, text:'0 District — Gold Shore lives' },
      { t:165, text:'Everything that music gives' },
      { t:180, text:'· · ·' },
      { t:197, text:'· · ·' }
    ]
  },

  't12': { /* Kinshasa Wake — River Bloc — 5:28 */
    title: 'KINSHASA WAKE', artist: 'RIVER BLOC',
    lines: [
      { t:0,   text:'' },
      { t:10,  text:'Congo River at the break of day' },
      { t:17,  text:'Kinshasa waking in its usual way' },
      { t:24,  text:'Pirogue cutting through the morning mist' },
      { t:31,  text:'Kinshasa Wake — can\'t be dismissed' },
      { t:38,  text:'' },
      { t:48,  text:'Market traders opening their stalls' },
      { t:55,  text:'Kinshasa beat bouncing off the walls' },
      { t:62,  text:'Rumba legacy in the afro house groove' },
      { t:69,  text:'River Bloc — finding the move' },
      { t:76,  text:'' },
      { t:88,  text:'Kinshasa wake — the river never sleeps' },
      { t:95,  text:'Congo music running fathoms deep' },
      { t:102, text:'From N\'Djili to the Cité Verte' },
      { t:109, text:'Kinshasa Wake — this is our art' },
      { t:116, text:'' },
      { t:130, text:'Lingala tongue in the four-four beat' },
      { t:137, text:'Kinshasa rhythms making it concrete' },
      { t:144, text:'Franco\'s guitar ghost in the melody' },
      { t:151, text:'River Bloc carries the memory' },
      { t:158, text:'' },
      { t:170, text:'Kinshasa wake — the river never sleeps' },
      { t:177, text:'Congo music running fathoms deep' },
      { t:184, text:'From N\'Djili to the Cité Verte' },
      { t:191, text:'Kinshasa Wake — this is our art' },
      { t:198, text:'' },
      { t:212, text:'0 District — Congo signal strong' },
      { t:219, text:'River Bloc playing the morning song' },
      { t:226, text:'Kinshasa Wake never ends' },
      { t:233, text:'Every river bend, it transcends' },
      { t:240, text:'' },
      { t:254, text:'Kinshasa wake — the river never sleeps' },
      { t:261, text:'Congo music running fathoms deep' },
      { t:268, text:'From N\'Djili to the Cité Verte' },
      { t:275, text:'Kinshasa Wake — this is our art' },
      { t:282, text:'' },
      { t:296, text:'Kinshasa... wake...' },
      { t:308, text:'Congo River... flowing...' },
      { t:320, text:'· · ·' },
      { t:326, text:'· · ·' }
    ]
  }
};

/* ═══════════════════════════════════════════════════════════════
   LYRICS SYNC ENGINE
   ═══════════════════════════════════════════════════════════════ */

var lyricsState = {
  open:        false,
  currentLine: -1,
  trackId:     null
};

/* Build the lyrics panel content for a given track */
function lyricsRender(trackId) {
  var panel = document.getElementById('lyricsPanel');
  if (!panel) return;
  var data = LYRICS_DATA[trackId];
  if (!data) {
    panel.querySelector('.lyrics-lines').innerHTML =
      '<div class="lyric-line lyric-instrumental">· · · instrumental · · ·</div>';
    return;
  }
  var header = panel.querySelector('.lyrics-header-title');
  if (header) header.textContent = data.title + ' — ' + data.artist;

  var container = panel.querySelector('.lyrics-lines');
  container.innerHTML = '';
  data.lines.forEach(function(line, i) {
    var div = document.createElement('div');
    div.className = 'lyric-line' + (line.text === '' || line.text === '· · ·' ? ' lyric-gap' : '');
    div.dataset.idx = i;
    div.textContent = line.text === '' ? '' : line.text;
    if (line.text === '· · ·') div.classList.add('lyric-instrumental');
    container.appendChild(div);
  });
  lyricsState.currentLine = -1;
}

/* Called every second by the player tick — updates active line */
function lyricsSync(elapsed, trackId) {
  if (!lyricsState.open) return;
  if (trackId !== lyricsState.trackId) {
    lyricsState.trackId = trackId;
    lyricsRender(trackId);
  }
  var data = LYRICS_DATA[trackId];
  if (!data) return;

  var activeLine = -1;
  for (var i = data.lines.length - 1; i >= 0; i--) {
    if (elapsed >= data.lines[i].t) { activeLine = i; break; }
  }

  if (activeLine === lyricsState.currentLine) return;
  lyricsState.currentLine = activeLine;

  var container = document.querySelector('.lyrics-lines');
  if (!container) return;

  container.querySelectorAll('.lyric-line').forEach(function(el, i) {
    var dist = i - activeLine;
    el.classList.remove('lyric-active','lyric-prev1','lyric-prev2','lyric-next1','lyric-next2','lyric-far');
    if (i === activeLine)      el.classList.add('lyric-active');
    else if (dist === -1)      el.classList.add('lyric-prev1');
    else if (dist === -2)      el.classList.add('lyric-prev2');
    else if (dist === 1)       el.classList.add('lyric-next1');
    else if (dist === 2)       el.classList.add('lyric-next2');
    else                       el.classList.add('lyric-far');
  });

  /* Auto-scroll to active line */
  var panel = document.getElementById('lyricsPanel');
  var activeDom = container.querySelector('.lyric-active');
  if (panel && activeDom) {
    var panelRect = panel.getBoundingClientRect();
    var lineRect  = activeDom.getBoundingClientRect();
    var offset    = lineRect.top - panelRect.top - panel.clientHeight / 2 + lineRect.height / 2;
    panel.scrollBy({ top: offset, behavior: 'smooth' });
  }
}

/* Toggle open/close */
function toggleLyricsPanel() {
  lyricsState.open = !lyricsState.open;
  var panel  = document.getElementById('lyricsPanel');
  var btn    = document.getElementById('lyricsToggleBtn');
  var overlay= document.getElementById('lyricsPanelOverlay');
  if (panel)   panel.classList.toggle('open', lyricsState.open);
  if (btn)     btn.classList.toggle('active', lyricsState.open);
  if (overlay) overlay.classList.toggle('open', lyricsState.open);

  if (lyricsState.open) {
    var tid = typeof player !== 'undefined' ? (typeof TRACKS !== 'undefined' ? TRACKS[player.currentIdx].id : null) : null;
    if (tid) lyricsRender(tid);
    lyricsState.trackId = tid;
    /* Sync immediately to current position */
    if (typeof player !== 'undefined') lyricsSync(player.elapsed, tid);
  }
}

/* Hook into the player — called from product.js updateProgress */
document.addEventListener('DOMContentLoaded', function() {
  /* Patch updateProgress to also fire lyricsSync */
  var _origUpdate = typeof updateProgress === 'function' ? updateProgress : null;
  if (_origUpdate) {
    window.updateProgress = function(pct) {
      _origUpdate(pct);
      if (typeof player !== 'undefined' && typeof TRACKS !== 'undefined') {
        lyricsSync(player.elapsed, TRACKS[player.currentIdx].id);
      }
    };
  }

  /* Also patch playerLoad to re-render lyrics on track change */
  var _origLoad = typeof playerLoad === 'function' ? playerLoad : null;
  if (_origLoad) {
    window.playerLoad = function(idx, autoPlay) {
      _origLoad(idx, autoPlay);
      if (lyricsState.open && typeof TRACKS !== 'undefined') {
        var tid = TRACKS[idx % TRACKS.length].id;
        lyricsRender(tid);
        lyricsState.trackId = tid;
      }
    };
  }
});
