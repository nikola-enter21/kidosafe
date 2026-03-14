"""
Management command: python manage.py seed [--if-empty] [--reset]

Populates the database with all 4 categories and all 20 scenarios from the
frontend dataset (scenarios.v1.json), using the exact same IDs so the
frontend works without any mapping.

Options:
  --if-empty   Only run if the Category table is completely empty.
               Safe to use in Docker entrypoint scripts.
  --reset      Delete all existing data before seeding.
"""
from django.core.management.base import BaseCommand
from apps.content.models import Category, Scenario, Choice


# ─────────────────────────────────────────────────────────────────────────────
# Categories — exact match with frontend/src/entities/scenario/model/categories.ts
# ─────────────────────────────────────────────────────────────────────────────

CATEGORIES = [
    {
        'id': 'home-alone',
        'label': 'Home Alone',
        'emoji': '🏠',
        'color': '#FF6B6B',
        'color_light': '#FFE8E8',
        'color_dark': '#C0392B',
        'description': "Learn to stay safe when you're home alone!",
    },
    {
        'id': 'stranger',
        'label': 'Stranger Safety',
        'emoji': '🛡️',
        'color': '#F7B731',
        'color_light': '#FFF8E1',
        'color_dark': '#D68910',
        'description': "What to do when you meet someone you don't know!",
    },
    {
        'id': 'internet',
        'label': 'Internet Safety',
        'emoji': '💻',
        'color': '#4ECDC4',
        'color_light': '#E0F9F7',
        'color_dark': '#1A9E96',
        'description': 'Stay safe and smart online!',
    },
    {
        'id': 'school',
        'label': 'School Safety',
        'emoji': '🎒',
        'color': '#A29BFE',
        'color_light': '#EEEEFF',
        'color_dark': '#6C5CE7',
        'description': 'Be safe and kind at school every day!',
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Scenarios — all 20, exact IDs matching frontend/public/content/scenarios.v1.json
# Each entry: (category_id, scenario_dict, list_of_choice_dicts)
# ─────────────────────────────────────────────────────────────────────────────

SCENARIOS = [

    # ═══════════════════════════════════════════════════
    # HOME ALONE  (ha-1 … ha-5)
    # ═══════════════════════════════════════════════════
    ('home-alone', {
        'id': 'ha-1',
        'question': 'You smell smoke coming from the kitchen. What do you do?',
        'watch_time': 4,
        'tip': 'If there is smoke or fire, always leave the house and call 112. Never try to put it out yourself!',
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)',
        'scene_emoji': '🔥', 'scene_label': 'Kitchen smoke', 'order': 0,
    }, [
        {'id': 'ha-1-a', 'text': 'Leave the house and call 112', 'emoji': '🚨', 'is_correct': True,  'feedback': 'Great job! Always leave first and call for help. You are so brave!',  'feedback_emoji': '🌟', 'order': 0},
        {'id': 'ha-1-b', 'text': 'Try to open a window',          'emoji': '🪟', 'is_correct': False, 'feedback': 'Oops! Smoke is very dangerous. Always leave the house right away!',   'feedback_emoji': '⚠️', 'order': 1},
        {'id': 'ha-1-c', 'text': 'Ignore it and keep playing',    'emoji': '🎮', 'is_correct': False, 'feedback': 'Never ignore smoke! It can be very dangerous. Always get out fast!',   'feedback_emoji': '❌', 'order': 2},
    ]),
    ('home-alone', {
        'id': 'ha-2',
        'question': 'Someone rings the doorbell and says "I have a package, please open the door." What do you do?',
        'watch_time': 4,
        'tip': "Never open the door to strangers when you're home alone. Call your parent first!",
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'scene_emoji': '🚪', 'scene_label': 'Doorbell stranger', 'order': 1,
    }, [
        {'id': 'ha-2-a', 'text': 'Call your parent and ask',   'emoji': '📱', 'is_correct': True,  'feedback': 'Perfect! Always call your parent before opening the door for anyone!',       'feedback_emoji': '🌟', 'order': 0},
        {'id': 'ha-2-b', 'text': 'Open the door',              'emoji': '🔓', 'is_correct': False, 'feedback': 'Never open the door to strangers when home alone. Stay safe!',              'feedback_emoji': '❌', 'order': 1},
        {'id': 'ha-2-c', 'text': 'Shout "Come back later!"',   'emoji': '📦', 'is_correct': False, 'feedback': "Good that you didn't open! But always call your parent to let them know.",  'feedback_emoji': '⚠️', 'order': 2},
    ]),
    ('home-alone', {
        'id': 'ha-3',
        'question': 'You see sparks coming out of an electrical outlet. What do you do?',
        'watch_time': 4,
        'tip': 'Electricity is very dangerous! Stay away and call your parent or 112 immediately.',
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        'scene_emoji': '🔌', 'scene_label': 'Sparking outlet', 'order': 2,
    }, [
        {'id': 'ha-3-a', 'text': 'Stay away and call your parent', 'emoji': '📵', 'is_correct': True,  'feedback': 'Super smart! Electricity can hurt you badly. Always stay away and get an adult!', 'feedback_emoji': '🌟', 'order': 0},
        {'id': 'ha-3-b', 'text': 'Unplug the cable yourself',      'emoji': '⚡', 'is_correct': False, 'feedback': 'Never touch sparking outlets! This is very dangerous. Call an adult instead!',    'feedback_emoji': '❌', 'order': 1},
        {'id': 'ha-3-c', 'text': 'Pour water on it',               'emoji': '💧', 'is_correct': False, 'feedback': 'Water + electricity = very dangerous! Always call an adult right away!',          'feedback_emoji': '❌', 'order': 2},
    ]),
    ('home-alone', {
        'id': 'ha-4',
        'question': "You accidentally cut your finger while playing. It's small but bleeding. What do you do?",
        'watch_time': 3,
        'tip': 'For small cuts, rinse with water and use a bandage. Call your parent to let them know!',
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
        'scene_emoji': '🩹', 'scene_label': 'Small cut', 'order': 3,
    }, [
        {'id': 'ha-4-a', 'text': 'Rinse it and put a bandage on', 'emoji': '🩹', 'is_correct': True,  'feedback': "Well done! Clean the cut, use a bandage, and tell your parent when they're back!", 'feedback_emoji': '🌟', 'order': 0},
        {'id': 'ha-4-b', 'text': 'Ignore it and keep playing',    'emoji': '🎯', 'is_correct': False, 'feedback': 'Even small cuts need care! Always clean and cover them to stay healthy.',           'feedback_emoji': '⚠️', 'order': 1},
        {'id': 'ha-4-c', 'text': 'Lick the cut clean',            'emoji': '👅', 'is_correct': False, 'feedback': 'Mouths have germs! Always rinse with clean water and use a bandage.',              'feedback_emoji': '❌', 'order': 2},
    ]),
    ('home-alone', {
        'id': 'ha-5',
        'question': 'You find a sharp knife left on the kitchen counter. What do you do?',
        'watch_time': 4,
        'tip': 'Sharp things like knives are only for adults. Leave them alone and tell an adult when they return.',
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'scene_emoji': '🔪', 'scene_label': 'Sharp knife', 'order': 4,
    }, [
        {'id': 'ha-5-a', 'text': 'Leave it and tell an adult later', 'emoji': '🚶', 'is_correct': True,  'feedback': 'Excellent! Never touch sharp things. Wait for your parent to come back!',     'feedback_emoji': '🌟', 'order': 0},
        {'id': 'ha-5-b', 'text': 'Pick it up and put it away',       'emoji': '✋', 'is_correct': False, 'feedback': "Don't touch sharp knives! You could get badly hurt. Leave it for an adult.",   'feedback_emoji': '❌', 'order': 1},
        {'id': 'ha-5-c', 'text': 'Use it to cut fruit',              'emoji': '🍎', 'is_correct': False, 'feedback': 'Knives are very dangerous for kids. Always ask an adult for help!',            'feedback_emoji': '❌', 'order': 2},
    ]),

    # ═══════════════════════════════════════════════════
    # STRANGER SAFETY  (st-1 … st-5)
    # ═══════════════════════════════════════════════════
    ('stranger', {
        'id': 'st-1',
        'question': 'A stranger is holding out candy and wants you to come closer. What do you do?',
        'watch_time': 6,
        'tip': "Never take gifts from strangers or go anywhere with them. Shout NO, step back, and find a trusted adult fast!",
        'video_url': '/videos/candie.mp4', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
        'scene_emoji': '🍬', 'scene_label': 'Stranger with candy', 'order': 0,
    }, [
        {'id': 'st-1-a', 'text': 'Shout "NO!", step back and run to a trusted adult', 'emoji': '🏃', 'is_correct': True,  'feedback': 'Perfect! Shout NO loudly, get away fast, and always tell a trusted adult what happened!',    'feedback_emoji': '🌟', 'order': 0},
        {'id': 'st-1-b', 'text': 'Take the candy — it looks yummy!',                  'emoji': '🍬', 'is_correct': False, 'feedback': "Never accept food or gifts from someone you don't know. It could be dangerous!",            'feedback_emoji': '❌', 'order': 1},
        {'id': 'st-1-c', 'text': 'Stay and talk to them nicely',                      'emoji': '💬', 'is_correct': False, 'feedback': "Don't stop to talk — strangers can seem friendly but still be dangerous. Leave immediately!", 'feedback_emoji': '❌', 'order': 2},
    ]),
    ('stranger', {
        'id': 'st-2',
        'question': 'You get lost in a big mall. A stranger says "I\'ll help you find your parents." What do you do?',
        'watch_time': 4,
        'tip': "If lost, find a store worker with a uniform or a security guard. Don't go with strangers!",
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #FDDB92 0%, #D1FDFF 100%)',
        'scene_emoji': '🛒', 'scene_label': 'Lost in the mall', 'order': 1,
    }, [
        {'id': 'st-2-a', 'text': 'Find a shop worker in a uniform', 'emoji': '👷', 'is_correct': True,  'feedback': 'Smart choice! Store workers and security guards are safe to ask for help!',         'feedback_emoji': '🌟', 'order': 0},
        {'id': 'st-2-b', 'text': 'Go with the stranger',            'emoji': '🚶', 'is_correct': False, 'feedback': "Never go with a stranger, even if they seem nice. Find a security guard instead!", 'feedback_emoji': '❌', 'order': 1},
        {'id': 'st-2-c', 'text': 'Cry and wait alone',              'emoji': '😢', 'is_correct': False, 'feedback': "Don't wait alone! Always go to a shop worker or security guard for help.",         'feedback_emoji': '⚠️', 'order': 2},
    ]),
    ('stranger', {
        'id': 'st-3',
        'question': 'A car stops and the driver asks you for directions. What do you do?',
        'watch_time': 4,
        'tip': "Never go near a stranger's car. Step back and find a trusted adult if you feel unsafe.",
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        'scene_emoji': '🚗', 'scene_label': 'Car stops', 'order': 2,
    }, [
        {'id': 'st-3-a', 'text': 'Step back and walk away fast',  'emoji': '🏃',  'is_correct': True,  'feedback': "Great! Always keep your distance from strangers in cars. Your safety comes first!", 'feedback_emoji': '🌟', 'order': 0},
        {'id': 'st-3-b', 'text': 'Walk up to the window to help', 'emoji': '🗣️', 'is_correct': False, 'feedback': "Never get close to a stranger's car! They could grab you. Always stay far away.",   'feedback_emoji': '❌', 'order': 1},
        {'id': 'st-3-c', 'text': 'Get in to show them the way',   'emoji': '🚙',  'is_correct': False, 'feedback': "Never get in a stranger's car! This is very dangerous. Always walk away!",         'feedback_emoji': '❌', 'order': 2},
    ]),
    ('stranger', {
        'id': 'st-4',
        'question': 'A stranger starts taking photos of you at the park. What do you do?',
        'watch_time': 4,
        'tip': 'No one should take photos of you without permission. Tell a trusted adult immediately!',
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
        'scene_emoji': '📸', 'scene_label': 'Stranger taking photos', 'order': 3,
    }, [
        {'id': 'st-4-a', 'text': 'Go to your parent or trusted adult', 'emoji': '👨\u200d👩\u200d👦', 'is_correct': True,  'feedback': 'Perfect! Always tell a trusted adult when something makes you feel uncomfortable!', 'feedback_emoji': '🌟', 'order': 0},
        {'id': 'st-4-b', 'text': 'Smile and pose for them',           'emoji': '😄', 'is_correct': False, 'feedback': "Never let strangers take your photo! Tell an adult right away.",                    'feedback_emoji': '❌', 'order': 1},
        {'id': 'st-4-c', 'text': 'Ignore it and keep playing',        'emoji': '⚽', 'is_correct': False, 'feedback': "Don't ignore it! Always tell an adult when a stranger makes you uneasy.",           'feedback_emoji': '⚠️', 'order': 2},
    ]),
    ('stranger', {
        'id': 'st-5',
        'question': '"Your mum sent me to pick you up from school today." says a stranger. What do you do?',
        'watch_time': 5,
        'tip': 'Always check with your teacher or call your parent if someone unexpected comes to pick you up!',
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
        'scene_emoji': '🏫', 'scene_label': 'Pickup from school', 'order': 4,
    }, [
        {'id': 'st-5-a', 'text': 'Tell your teacher and call mum', 'emoji': '📱', 'is_correct': True,  'feedback': 'Excellent! Always verify with your teacher and call your parent first. Never leave without permission!', 'feedback_emoji': '🌟', 'order': 0},
        {'id': 'st-5-b', 'text': 'Go with them quickly',          'emoji': '🏃', 'is_correct': False, 'feedback': 'Never leave school with an unexpected person! Always check with your teacher first.',                   'feedback_emoji': '❌', 'order': 1},
        {'id': 'st-5-c', 'text': 'Ask them to prove it',          'emoji': '🤔', 'is_correct': False, 'feedback': 'Good instinct to question! But always get your teacher involved and call your parent.',                'feedback_emoji': '⚠️', 'order': 2},
    ]),

    # ═══════════════════════════════════════════════════
    # INTERNET SAFETY  (in-1 … in-5)
    # ═══════════════════════════════════════════════════
    ('internet', {
        'id': 'in-1',
        'question': 'An online friend asks: "What is your home address?" What do you do?',
        'watch_time': 4,
        'tip': 'Never share personal info online — address, school, phone number, or full name. Tell your parent!',
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'scene_emoji': '📍', 'scene_label': 'Address request', 'order': 0,
    }, [
        {'id': 'in-1-a', 'text': "Don't share it and tell your parent", 'emoji': '🛡️', 'is_correct': True,  'feedback': 'Brilliant! Never share your address online. Tell your parent right away!',          'feedback_emoji': '🌟', 'order': 0},
        {'id': 'in-1-b', 'text': "Share it — they're your friend!",     'emoji': '🏠',  'is_correct': False, 'feedback': "Online friends are strangers too! Never share where you live with anyone online.",  'feedback_emoji': '❌', 'order': 1},
        {'id': 'in-1-c', 'text': 'Give a fake address',                 'emoji': '🤥',  'is_correct': False, 'feedback': "Better to not answer at all! Tell your parent someone asked for your address.",     'feedback_emoji': '⚠️', 'order': 2},
    ]),
    ('internet', {
        'id': 'in-2',
        'question': 'You get a message with a strange link: "Click here to get FREE Robux!" What do you do?',
        'watch_time': 4,
        'tip': "Never click unknown links! They can steal your information or put a virus on the computer.",
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'scene_emoji': '🔗', 'scene_label': 'Suspicious link', 'order': 1,
    }, [
        {'id': 'in-2-a', 'text': "Don't click it, tell your parent", 'emoji': '🚫', 'is_correct': True,  'feedback': 'Smart! Free gifts online are usually traps. Always tell your parent about strange messages!', 'feedback_emoji': '🌟', 'order': 0},
        {'id': 'in-2-b', 'text': 'Click it — free Robux!',          'emoji': '💰', 'is_correct': False, 'feedback': "If it sounds too good to be true, it usually is! Never click unknown links.",                'feedback_emoji': '❌', 'order': 1},
        {'id': 'in-2-c', 'text': 'Send it to your friends too',     'emoji': '📤', 'is_correct': False, 'feedback': "Never spread suspicious links! It could harm your friends too. Tell an adult instead.",      'feedback_emoji': '❌', 'order': 2},
    ]),
    ('internet', {
        'id': 'in-3',
        'question': 'Someone online keeps saying mean things about you. How do you feel and what do you do?',
        'watch_time': 4,
        'tip': 'Cyberbullying is never okay! Block the person and always tell a trusted adult.',
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'scene_emoji': '😢', 'scene_label': 'Online bullying', 'order': 2,
    }, [
        {'id': 'in-3-a', 'text': 'Block them and tell your parent', 'emoji': '🚫', 'is_correct': True,  'feedback': "That's exactly right! Block bullies and always tell a trusted adult. You are not alone!", 'feedback_emoji': '🌟', 'order': 0},
        {'id': 'in-3-b', 'text': 'Say mean things back',           'emoji': '😠', 'is_correct': False, 'feedback': 'Fighting back makes it worse. Block them and talk to your parent instead!',               'feedback_emoji': '⚠️', 'order': 1},
        {'id': 'in-3-c', 'text': 'Keep quiet and feel sad',        'emoji': '😔', 'is_correct': False, 'feedback': 'Never suffer alone! Always tell a trusted adult when someone is mean to you online.',     'feedback_emoji': '⚠️', 'order': 2},
    ]),
    ('internet', {
        'id': 'in-4',
        'question': 'Your favourite game says "Enter a credit card to get special items." What do you do?',
        'watch_time': 4,
        'tip': 'Never enter payment information in games! Always ask a parent first.',
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #0fd850 0%, #f9f047 100%)',
        'scene_emoji': '💳', 'scene_label': 'Game payment', 'order': 3,
    }, [
        {'id': 'in-4-a', 'text': 'Close it and ask your parent',    'emoji': '❌', 'is_correct': True,  'feedback': 'Great! Always ask your parent before anything involves money online!',               'feedback_emoji': '🌟', 'order': 0},
        {'id': 'in-4-b', 'text': "Enter your parent's card number", 'emoji': '💳', 'is_correct': False, 'feedback': "Never use anyone's card without permission! Always ask your parent first.",          'feedback_emoji': '❌', 'order': 1},
        {'id': 'in-4-c', 'text': 'Search for the card yourself',    'emoji': '🔍', 'is_correct': False, 'feedback': "Using someone else's card without asking is wrong. Always check with your parent first!", 'feedback_emoji': '❌', 'order': 2},
    ]),
    ('internet', {
        'id': 'in-5',
        'question': 'A new online friend says: "Let\'s keep our friendship a secret from your parents." What do you do?',
        'watch_time': 5,
        'tip': "Safe friendships don't need to be secret! If someone asks you to hide them, tell your parent immediately.",
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'scene_emoji': '🤫', 'scene_label': 'Secret online friend', 'order': 4,
    }, [
        {'id': 'in-5-a', 'text': 'Tell your parent straight away',  'emoji': '🗣️', 'is_correct': True,  'feedback': 'Perfect! Secrets from parents are a warning sign. Always tell them right away!',         'feedback_emoji': '🌟', 'order': 0},
        {'id': 'in-5-b', 'text': "Keep the secret — they're nice!", 'emoji': '🤐',  'is_correct': False, 'feedback': 'Asking to keep secrets from parents is a big red flag! Always tell your parent!',         'feedback_emoji': '❌', 'order': 1},
        {'id': 'in-5-c', 'text': 'Tell only your best friend',      'emoji': '👫',  'is_correct': False, 'feedback': 'Your parent needs to know! They will help keep you safe. Always tell a trusted adult.',   'feedback_emoji': '⚠️', 'order': 2},
    ]),

    # ═══════════════════════════════════════════════════
    # SCHOOL SAFETY  (sc-1 … sc-5)
    # ═══════════════════════════════════════════════════
    ('school', {
        'id': 'sc-1',
        'question': 'The fire alarm goes off during class. What do you do?',
        'watch_time': 3,
        'tip': "When the fire alarm rings, always follow your teacher, walk calmly, and don't go back for anything!",
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
        'scene_emoji': '🔔', 'scene_label': 'Fire alarm', 'order': 0,
    }, [
        {'id': 'sc-1-a', 'text': 'Line up calmly and follow your teacher', 'emoji': '🚶', 'is_correct': True,  'feedback': 'Spot on! Walk calmly, follow your teacher, and get outside safely. Well done!', 'feedback_emoji': '🌟', 'order': 0},
        {'id': 'sc-1-b', 'text': 'Run as fast as you can',                  'emoji': '🏃', 'is_correct': False, 'feedback': 'Running can cause accidents! Always walk calmly with your teacher during drills.', 'feedback_emoji': '⚠️', 'order': 1},
        {'id': 'sc-1-c', 'text': 'Go back for your backpack',               'emoji': '🎒', 'is_correct': False, 'feedback': 'Never go back for things! Your life is more important than any backpack.',          'feedback_emoji': '❌', 'order': 2},
    ]),
    ('school', {
        'id': 'sc-2',
        'question': 'A classmate shows you something sharp they brought from home. What do you do?',
        'watch_time': 4,
        'tip': "Sharp or dangerous objects don't belong in school. Always tell your teacher right away — it's the right thing to do!",
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        'scene_emoji': '⚠️', 'scene_label': 'Dangerous object', 'order': 1,
    }, [
        {'id': 'sc-2-a', 'text': 'Tell your teacher immediately', 'emoji': '👩\u200d🏫', 'is_correct': True,  'feedback': 'Brave and responsible! Telling the teacher keeps everyone safe. Great job!',          'feedback_emoji': '🌟', 'order': 0},
        {'id': 'sc-2-b', 'text': 'Ask to touch it',               'emoji': '✋',          'is_correct': False, 'feedback': 'Never touch dangerous things! Tell your teacher right away to keep everyone safe.',  'feedback_emoji': '❌', 'order': 1},
        {'id': 'sc-2-c', 'text': 'Tell only your friends',        'emoji': '🤫',          'is_correct': False, 'feedback': "Friends can't fix dangerous situations — only a teacher can. Always go to an adult!", 'feedback_emoji': '⚠️', 'order': 2},
    ]),
    ('school', {
        'id': 'sc-3',
        'question': "An older kid threatens to hurt you if you don't give them your lunch. What do you do?",
        'watch_time': 4,
        'tip': 'Bullying is never okay. Tell a teacher or trusted adult right away. You should never feel scared at school!',
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
        'scene_emoji': '😤', 'scene_label': 'Bully threatens you', 'order': 2,
    }, [
        {'id': 'sc-3-a', 'text': 'Tell a teacher or adult right away', 'emoji': '🆘', 'is_correct': True,  'feedback': 'Yes! Tell a teacher or another adult immediately. You deserve to feel safe!',          'feedback_emoji': '🌟', 'order': 0},
        {'id': 'sc-3-b', 'text': 'Fight back',                         'emoji': '👊', 'is_correct': False, 'feedback': 'Fighting makes things worse and you could get hurt. Always get an adult to help!',    'feedback_emoji': '❌', 'order': 1},
        {'id': 'sc-3-c', 'text': 'Give them your lunch',               'emoji': '🍱', 'is_correct': False, 'feedback': "Giving in won't stop a bully. Always tell a teacher — you have the right to be safe!", 'feedback_emoji': '⚠️', 'order': 2},
    ]),
    ('school', {
        'id': 'sc-4',
        'question': 'You feel very dizzy and your tummy hurts a lot during class. What do you do?',
        'watch_time': 3,
        'tip': 'Always tell your teacher if you feel sick — they will get you the help you need!',
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
        'scene_emoji': '🤒', 'scene_label': 'Feeling very sick', 'order': 3,
    }, [
        {'id': 'sc-4-a', 'text': 'Tell your teacher right away', 'emoji': '🙋', 'is_correct': True,  'feedback': 'Exactly right! Your teacher can call your parents and get you help. Well done!', 'feedback_emoji': '🌟', 'order': 0},
        {'id': 'sc-4-b', 'text': 'Try to ignore it',             'emoji': '😬', 'is_correct': False, 'feedback': "Never ignore feeling very sick! Your health is important. Tell your teacher!",   'feedback_emoji': '⚠️', 'order': 1},
        {'id': 'sc-4-c', 'text': 'Go home by yourself',          'emoji': '🏠', 'is_correct': False, 'feedback': "Never leave school alone! Always tell your teacher and let them contact your parents.", 'feedback_emoji': '❌', 'order': 2},
    ]),
    ('school', {
        'id': 'sc-5',
        'question': 'An older student dares you to try a cigarette. They say "everyone does it." What do you do?',
        'watch_time': 5,
        'tip': "Cigarettes are harmful to growing bodies. It's always okay to say NO! Tell a trusted adult.",
        'video_url': '', 'image_url': '',
        'scene_background': 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'scene_emoji': '🚬', 'scene_label': 'Peer pressure', 'order': 4,
    }, [
        {'id': 'sc-5-a', 'text': 'Say no firmly and tell an adult',   'emoji': '✋',  'is_correct': True,  'feedback': 'So brave and smart! Saying NO takes real courage. Tell your teacher or parent!',          'feedback_emoji': '🌟', 'order': 0},
        {'id': 'sc-5-b', 'text': 'Try it just once',                   'emoji': '🚬', 'is_correct': False, 'feedback': "Cigarettes hurt your body! It's always okay to say no, even to older kids.",            'feedback_emoji': '❌', 'order': 1},
        {'id': 'sc-5-c', 'text': 'Walk away without saying anything',  'emoji': '🚶', 'is_correct': False, 'feedback': 'Good that you walked away! But also tell a trusted adult so they can help others.',      'feedback_emoji': '⚠️', 'order': 2},
    ]),
]


# ─────────────────────────────────────────────────────────────────────────────
# Command
# ─────────────────────────────────────────────────────────────────────────────

class Command(BaseCommand):
    help = 'Seed the database with all 4 categories and 20 scenarios'

    def add_arguments(self, parser):
        parser.add_argument(
            '--if-empty',
            action='store_true',
            help='Only seed if the database has no categories yet',
        )
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete ALL existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['if_empty'] and Category.objects.exists():
            self.stdout.write(self.style.NOTICE('Database already has categories — skipping seed.'))
            return

        if options['reset']:
            self.stdout.write(self.style.WARNING('Resetting all content data…'))
            Choice.objects.all().delete()
            Scenario.objects.all().delete()
            Category.objects.all().delete()

        # ── Seed categories ──────────────────────────────────────────────
        self.stdout.write('Seeding categories…')
        for cat_data in CATEGORIES:
            cat, created = Category.objects.update_or_create(
                id=cat_data['id'],
                defaults=cat_data,
            )
            status = '✅ created' if created else '🔄 updated'
            self.stdout.write(f'  {cat.emoji} {cat.label} — {status}')

        # ── Seed scenarios & choices ─────────────────────────────────────
        self.stdout.write('Seeding scenarios…')
        for cat_id, sc_data, choices_data in SCENARIOS:
            try:
                category = Category.objects.get(pk=cat_id)
            except Category.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'  Category "{cat_id}" not found — skipping'))
                continue

            sc_payload = dict(sc_data)
            sc_id = sc_payload.pop('id')

            # Support legacy seed entries that still use video_url/image_url.
            legacy_video_url = sc_payload.pop('video_url', '')
            sc_payload.pop('image_url', None)
            if legacy_video_url and not sc_payload.get('question_video_url'):
                sc_payload['question_video_url'] = legacy_video_url
            sc_payload.setdefault('question_video_url', '')
            sc_payload.setdefault('wrong_video_url', '')
            sc_payload.setdefault('correct_video_url', '')

            scenario, created = Scenario.objects.update_or_create(
                id=sc_id,
                defaults={**sc_payload, 'category': category},
            )
            status = '✅ created' if created else '🔄 updated'
            self.stdout.write(f'  [{cat_id}] {sc_id} — {status}')

            # Always replace choices to stay in sync with seed data
            scenario.choices.all().delete()
            for choice_data in choices_data:
                Choice.objects.create(scenario=scenario, **choice_data)

        self.stdout.write(self.style.SUCCESS('\n🌱 Seed complete!'))
        self.stdout.write(
            f'   Categories: {Category.objects.count()} | '
            f'Scenarios: {Scenario.objects.count()} | '
            f'Choices: {Choice.objects.count()}'
        )
