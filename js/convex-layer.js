/* ═══════════════════════════════════════════════════════════════
   0 DISTRICT — CONVEX DATA LAYER
   ═══════════════════════════════════════════════════════════════
   HOW TO CONNECT REAL BACKEND:
   1. Run: npx convex deploy  (from 0Promo folder, after `npx convex login`)
   2. Copy your deployment URL from Convex dashboard
   3. Replace CONVEX_URL below with your real URL
   4. Uncomment the Convex SDK script tag in each HTML file
   5. Replace mock functions below with real Convex queries

   CONVEX DEPLOYMENT URL (fill in after deploy):
   const CONVEX_URL = "https://YOUR_DEPLOYMENT.convex.cloud";
   ═══════════════════════════════════════════════════════════════ */

/* ── MOCK DATA (mirrors your convex/schema.ts tables) ── */

var DISTRICT_DATA = {

  stats: {
    artists:   1247,
    tracks:    8432,
    districts: 6,
    live:      24
  },

  tracks: [
    { _id:'t1',  title:'Accra Nights',      artistId:'a1', artist:'Kofi Manu',     city:'Accra',        country:'GH', genre:'Afrobeats',  badge:'LIVE',   art:'art-red',    label:'KM', duration:'3:47', plays:1284, likes:312  },
    { _id:'t2',  title:'Dakar Frequency',   artistId:'a2', artist:'DJ Senegal',    city:'Dakar',        country:'SN', genre:'Afro House', badge:'NEW',    art:'art-blue',   label:'DS', duration:'4:12', plays:891,  likes:204  },
    { _id:'t3',  title:'Lagos Ritual',      artistId:'a3', artist:'Zara.B',        city:'Lagos',        country:'NG', genre:'Afro Soul',  badge:'REMIX',  art:'art-purple', label:'ZB', duration:'3:28', plays:2103, likes:487  },
    { _id:'t4',  title:'Midnight Lagos',    artistId:'a4', artist:'Ofo Beats',     city:'Lagos',        country:'NG', genre:'Afrobeats',  badge:'SINGLE', art:'art-green',  label:'OB', duration:'4:55', plays:753,  likes:198  },
    { _id:'t5',  title:'Joburg Grid',       artistId:'a5', artist:'Echo Delta',    city:'Johannesburg', country:'ZA', genre:'Electronic', badge:'EP',     art:'art-amber',  label:'ED', duration:'5:01', plays:1876, likes:441  },
    { _id:'t6',  title:'Nairobi Rise',      artistId:'a6', artist:'Yemi.K',        city:'Nairobi',      country:'KE', genre:'Afropop',    badge:'TRACK',  art:'art-teal',   label:'YK', duration:'3:33', plays:627,  likes:145  },
    { _id:'t7',  title:'Afro Pulse',        artistId:'a7', artist:'Amara X Pulse', city:'Abidjan',      country:'CI', genre:'Afrobeats',  badge:'ALBUM',  art:'art-purple', label:'AP', duration:'4:08', plays:934,  likes:267  },
    { _id:'t8',  title:'Nile Blue',         artistId:'a8', artist:'Cairo Sound',   city:'Cairo',        country:'EG', genre:'Electronic', badge:'SINGLE', art:'art-red',    label:'NB', duration:'3:52', plays:412,  likes:89   },
    { _id:'t9',  title:'Third Wave',        artistId:'a9', artist:'Pulse Network', city:'Kinshasa',     country:'CD', genre:'Amapiano',   badge:'REMIX',  art:'art-mono',   label:'TW', duration:'6:14', plays:1422, likes:388  },
    { _id:'t10', title:'Signal Void',       artistId:'a10',artist:'Freq District', city:'Nairobi',      country:'KE', genre:'Electronic', badge:'EP',     art:'art-teal',   label:'SV', duration:'4:44', plays:678,  likes:201  },
    { _id:'t11', title:'Gold Shore',        artistId:'a11',artist:'Tema Coast',    city:'Accra',        country:'GH', genre:'Highlife',   badge:'SINGLE', art:'art-amber',  label:'GS', duration:'3:19', plays:1103, likes:321  },
    { _id:'t12', title:'Kinshasa Wake',     artistId:'a12',artist:'River Bloc',    city:'Kinshasa',     country:'CD', genre:'Afro House', badge:'TRACK',  art:'art-green',  label:'KW', duration:'5:28', plays:556,  likes:167  },
  ],

  artists: [
    { _id:'a1',  name:'Kofi Manu',     genre:'Afrobeats',   city:'Accra',        country:'GH', art:'art-red',    label:'KM', followers:12400, verified:true  },
    { _id:'a2',  name:'DJ Senegal',    genre:'Afro House',  city:'Dakar',        country:'SN', art:'art-blue',   label:'DS', followers:8700,  verified:true  },
    { _id:'a3',  name:'Zara.B',        genre:'Afro Soul',   city:'Lagos',        country:'NG', art:'art-purple', label:'ZB', followers:21300, verified:true  },
    { _id:'a4',  name:'Ofo Beats',     genre:'Afrobeats',   city:'Lagos',        country:'NG', art:'art-green',  label:'OB', followers:6200,  verified:false },
    { _id:'a5',  name:'Echo Delta',    genre:'Electronic',  city:'Johannesburg', country:'ZA', art:'art-amber',  label:'ED', followers:15800, verified:true  },
    { _id:'a6',  name:'Yemi.K',        genre:'Afropop',     city:'Nairobi',      country:'KE', art:'art-teal',   label:'YK', followers:9400,  verified:false },
    { _id:'a7',  name:'Amara',         genre:'R&B',         city:'Abidjan',      country:'CI', art:'art-mono',   label:'AM', followers:7100,  verified:false },
  ],

  collabs: [
    { _id:'c1', title:'Afropop Remix Challenge',    creator:'Echo Delta',  genre:'Afrobeats',  open:true,  applicants:34, deadline:'Mar 28', reward:'Credit + 40% royalty split' },
    { _id:'c2', title:'Nairobi Session Vol.4',      creator:'Yemi.K',      genre:'Electronic', open:true,  applicants:12, deadline:'Apr 3',  reward:'Studio time + co-release'    },
    { _id:'c3', title:'Lagos Drill Collab',         creator:'Ofo Beats',   genre:'Drill',      open:true,  applicants:28, deadline:'Mar 25', reward:'Feature credit + royalties'  },
    { _id:'c4', title:'Amapiano Beat Pack Feature', creator:'Pulse Network',genre:'Amapiano',  open:true,  applicants:19, deadline:'Apr 10', reward:'Paid feature + promo'        },
    { _id:'c5', title:'Continental Fusion Project', creator:'Cairo Sound', genre:'Fusion',     open:true,  applicants:41, deadline:'Apr 15', reward:'Label partnership + release'  },
    { _id:'c6', title:'Afro House DJ Set',          creator:'DJ Senegal',  genre:'Afro House', open:false, applicants:22, deadline:'Mar 20', reward:'Closing credits + revenue'    },
  ],

  posts: [
    { _id:'p1', author:'Kofi Manu',     content:'Just dropped Accra Nights — 48 hours in the studio, pure energy. Stream now ↑', votes:247, comments:34, time:'2h ago',  tag:'DROP'     },
    { _id:'p2', author:'Echo Delta',    content:'Looking for a vocalist for the Joburg Grid EP. Afro soul, 2-3 octave range. DM if serious.', votes:183, comments:28, time:'4h ago',  tag:'COLLAB'   },
    { _id:'p3', author:'Zara.B',        content:'The Lagos Ritual remix pack is live. 6 producers, 6 cities, one frequency. Respect to everyone who contributed.', votes:412, comments:67, time:'6h ago',  tag:'RELEASE'  },
    { _id:'p4', author:'DJ Senegal',    content:'Dakar Nights Vol.3 live stream starts in 30 minutes. Afro House selects, full 3 hour set.', votes:318, comments:45, time:'8h ago',  tag:'LIVE'     },
    { _id:'p5', author:'Pulse Network', content:'Third Wave crossed 1,400 plays this week. Never expected a Kinshasa amapiano track to hit like this.', votes:156, comments:21, time:'12h ago', tag:'MILESTONE'},
    { _id:'p6', author:'Tema Coast',    content:'Gold Shore is out. It took 2 years, 4 cities, and one belief in the Highlife renaissance. Available everywhere.', votes:289, comments:52, time:'1d ago',  tag:'DROP'     },
  ]
};

/* ── PUBLIC API (will hit Convex once deployed) ── */
var DistrictAPI = {

  getStats: function(cb) {
    // TODO: replace with → convexClient.query(api.analytics.getStats)
    setTimeout(function() { cb(null, DISTRICT_DATA.stats); }, 60);
  },

  getTracks: function(filter, cb) {
    // TODO: replace with → convexClient.query(api.tracks.list, { genre: filter })
    var tracks = DISTRICT_DATA.tracks;
    if (filter && filter !== 'ALL') {
      tracks = tracks.filter(function(t) {
        return t.genre.toUpperCase().includes(filter.toUpperCase());
      });
    }
    setTimeout(function() { cb(null, tracks); }, 80);
  },

  getArtists: function(cb) {
    // TODO: replace with → convexClient.query(api.users.topArtists)
    setTimeout(function() { cb(null, DISTRICT_DATA.artists); }, 80);
  },

  getCollabs: function(cb) {
    // TODO: replace with → convexClient.query(api.collabs.listOpen)
    setTimeout(function() { cb(null, DISTRICT_DATA.collabs); }, 80);
  },

  getPosts: function(cb) {
    // TODO: replace with → convexClient.query(api.posts.list)
    setTimeout(function() { cb(null, DISTRICT_DATA.posts); }, 80);
  },

  incrementPlay: function(trackId) {
    // TODO: replace with → convexClient.mutation(api.tracks.incrementPlay, { trackId })
    var track = DISTRICT_DATA.tracks.find(function(t) { return t._id === trackId; });
    if (track) track.plays++;
  }
};

/* ── STATS COUNTER (replaces hardcoded zeros) ── */
document.addEventListener('DOMContentLoaded', function() {
  DistrictAPI.getStats(function(err, stats) {
    if (err) return;
    function countUp(el, target) {
      if (!el) return;
      var start = 0;
      var step = Math.ceil(target / 40);
      var timer = setInterval(function() {
        start = Math.min(start + step, target);
        el.textContent = start.toLocaleString();
        if (start >= target) clearInterval(timer);
      }, 35);
    }
    countUp(document.getElementById('statArtists'),  stats.artists);
    countUp(document.getElementById('statTracks'),   stats.tracks);
    countUp(document.getElementById('statDistricts'),stats.districts);
    countUp(document.getElementById('statLive'),     stats.live);
  });
});
