"""Sound library for the Upload Studio.

Every track here is free to use:
  * SoundHelix example songs (royalty-free demo tracks)
  * Music by Kevin MacLeod (incompetech.com), licensed under Creative Commons
    Attribution 4.0 — the artist credit shown in the app is the attribution.

Chart music (the songs on the radio) can NOT be added here without a licensing
deal with the labels. To add more free tracks, append to SOUND_LIBRARY — ideally
hosting the files in your own media bucket rather than linking to another site.
"""

_SH = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-{}.mp3'
_KM = 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/{}.mp3'
_KM_ARTIST = 'Kevin MacLeod'


def _sh(n, name, artist, emoji, genre):
    return {'id': f's{n}', 'name': name, 'artist': artist, 'emoji': emoji,
            'genre': genre, 'url': _SH.format(n)}


def _km(key, name, emoji, genre, filename=None):
    return {'id': f'km-{key}', 'name': name, 'artist': _KM_ARTIST, 'emoji': emoji,
            'genre': genre, 'url': _KM.format((filename or name).replace(' ', '%20'))}


SOUND_LIBRARY = [
    # ── house originals ──
    _sh(1,  'About Last Night (Anthem)', 'DJ Verde',          '🌃', 'Party'),
    _sh(2,  'Neon Nights',               'Aura House Band',   '💜', 'Electronic'),
    _sh(3,  'Midnight Drive',            'Citrus Wave',       '🚗', 'Chill'),
    _sh(4,  'Glow Up',                   'The After Hours',   '✨', 'Upbeat'),
    _sh(5,  'Last Call',                 'Velvet Static',     '🍹', 'Party'),
    _sh(6,  '2AM Energy',                'MC Ember',          '⚡', 'Electronic'),
    _sh(7,  'Rooftop Sunrise',           'Lone Disco',        '🌅', 'Chill'),
    _sh(8,  'Bass in the Basement',      'Subwoofer Society', '🔊', 'Electronic'),
    _sh(9,  'Confetti Rain',             'Party Theory',      '🎉', 'Party'),
    _sh(10, 'Strobe Light Heartbeat',    'Nightcap',          '🪩', 'Electronic'),
    _sh(11, 'Dance Floor Gravity',       'Orbit Club',        '🕺', 'Party'),
    _sh(12, 'Afterglow',                 'Sunset Karaoke',    '🧡', 'Chill'),
    _sh(13, 'Golden Hour Groove',        'Polaroid Funk',     '📸', 'Funk'),
    _sh(14, 'City Lights Lullaby',       'Skyline Echo',      '🌆', 'Chill'),
    _sh(15, 'Weekend Forecast',          'The Vibe Bureau',   '🌦️', 'Upbeat'),
    _sh(16, 'Encore Encore',             'Stagedive Social',  '🎤', 'Upbeat'),
    _sh(17, 'Sunrise Cleanup Crew',      'Morning After',     '🧹', 'Chill'),

    # ── upbeat / feel-good ──
    _km('carefree',    'Carefree',            '😎', 'Upbeat'),
    _km('lifeofriley', 'Life of Riley',       '🌞', 'Upbeat'),
    _km('happyalley',  'Happy Alley',         '😄', 'Upbeat'),
    _km('inspired',    'Inspired',            '💡', 'Upbeat'),
    _km('wallpaper',   'Wallpaper',           '🖼️', 'Upbeat'),
    _km('onmyway',     'On My Way',           '🚶', 'Upbeat'),
    _km('upbeat',      'Upbeat Forever',      '🙌', 'Upbeat'),
    _km('vivacity',    'Vivacity',            '🎈', 'Upbeat'),
    _km('mighty',      'Mighty Like Us',      '💪', 'Upbeat'),

    # ── funny / meme ──
    _km('sneaky',      'Sneaky Snitch',       '🕵️', 'Funny'),
    _km('monkeys',     'Monkeys Spinning Monkeys', '🐒', 'Funny'),
    _km('duck',        'Fluffing a Duck',     '🦆', 'Funny'),
    _km('weasel',      'Scheming Weasel',     '🦡', 'Funny', 'Scheming Weasel faster'),
    _km('polka',       'Pixel Peeker Polka',  '🕹️', 'Funny', 'Pixel Peeker Polka - faster'),
    _km('elevator',    'Elevator Music',      '🛗', 'Funny', 'Local Forecast - Elevator'),
    _km('thief',       'Thief in the Night',  '🥷', 'Funny'),

    # ── funk / groove ──
    _km('funkorama',   'Funkorama',           '🎸', 'Funk'),
    _km('groove',      'Groove Grove',        '🪘', 'Funk'),
    _km('protofunk',   'Protofunk',           '🎺', 'Funk'),
    _km('rollin',      'Rollin at 5',         '🛼', 'Funk'),
    _km('toocool',     'Too Cool',            '🧊', 'Funk'),
    _km('werq',        'Werq',                '💃', 'Funk'),

    # ── chill / lo-fi ──
    _km('chillwave',   'Chill Wave',          '🌊', 'Chill'),
    _km('coolvibes',   'Cool Vibes',          '🍃', 'Chill'),
    _km('deliberate',  'Deliberate Thought',  '💭', 'Chill'),
    _km('iceflow',     'Ice Flow',            '❄️', 'Chill'),
    _km('backbay',     'Backbay Lounge',      '🛋️', 'Chill'),

    # ── jazz / lounge ──
    _km('hepcats',     'Hep Cats',            '🐈', 'Jazz'),
    _km('bossa',       'Bossa Antigua',       '🌴', 'Jazz'),
    _km('brunch',      'Jazz Brunch',         '🥞', 'Jazz'),
    _km('lobby',       'Lobby Time',          '🏨', 'Jazz'),
    _km('fasterdoes',  'Faster Does It',      '🎷', 'Jazz'),
    _km('spyglass',    'Spy Glass',           '🔍', 'Jazz'),

    # ── electronic / gaming ──
    _km('cabello',     'Electro Cabello',     '🎛️', 'Electronic'),
    _km('neonlaser',   'Neon Laser Horizon',  '🌈', 'Electronic'),
    _km('voxel',       'Voxel Revolution',    '👾', 'Electronic'),
    _km('blippy',      'Blippy Trance',       '🛸', 'Electronic'),

    # ── cinematic / hype ──
    _km('aceshigh',    'Aces High',           '✈️', 'Hype'),
    _km('killers',     'Killers',             '🔥', 'Hype'),
]

GENRES = ['Upbeat', 'Party', 'Funny', 'Funk', 'Chill', 'Jazz', 'Electronic', 'Hype']

_BY_URL = {s['url']: s for s in SOUND_LIBRARY}


def build_sound_catalog(posts, hidden_user_ids=()):
    """Everything the sound picker needs.

    * sounds    — the full library, each with how many posts use it
    * trending  — what people are actually using right now, most-used first
                  (library tracks AND original sounds from people's videos)
    * originals — audio from recent videos that anyone can reuse
    """
    uses = {}
    custom = {}        # non-library sounds people attached, keyed by url
    originals = []

    for p in posts:
        if p.user_id in hidden_user_ids:
            continue
        if p.sound_url:
            uses[p.sound_url] = uses.get(p.sound_url, 0) + 1
            if p.sound_url not in _BY_URL and p.sound_url not in custom:
                custom[p.sound_url] = {
                    'id': f'u-{p.id}',
                    'name': p.sound_name or 'Original sound',
                    'artist': f'@{p.user.username}' if p.user else 'Aura',
                    'emoji': '🎵', 'genre': 'Original', 'url': p.sound_url,
                }
        elif p.video_url and (p.media_type or 'video') == 'video' and p.user:
            originals.append({
                'id': f'o-{p.id}',
                'name': f'Original sound — {p.user.username}',
                'artist': f'@{p.user.username}',
                'emoji': '🎙️', 'genre': 'Original', 'url': p.video_url,
                'uses': 1,
                '_score': (p.views or 0) + len(p.likes) * 50,
            })

    library = [{**s, 'uses': uses.get(s['url'], 0)} for s in SOUND_LIBRARY]
    customs = [{**s, 'uses': uses.get(s['url'], 0)} for s in custom.values()]

    originals.sort(key=lambda s: s['_score'], reverse=True)
    originals = [{k: v for k, v in s.items() if k != '_score'} for s in originals[:20]]

    used = [s for s in library + customs if s['uses'] > 0]
    used.sort(key=lambda s: s['uses'], reverse=True)
    trending = used[:12] + originals[:6]
    if len(trending) < 8:      # quiet app: pad with staff picks so it isn't empty
        seen = {s['id'] for s in trending}
        trending += [s for s in library if s['id'] not in seen][:8 - len(trending)]

    return {
        'sounds': library + customs,
        'trending': trending,
        'originals': originals,
        'genres': GENRES,
    }
