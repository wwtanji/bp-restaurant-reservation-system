"""
Seed script — creates restaurant owner accounts and 10 sample Slovak restaurants.

Run from the backend directory:
    python seed_restaurants.py
"""

import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv

load_dotenv()

from passlib.context import CryptContext
from app.db.database import SessionLocal
from app.models.user import User, UserRole
from app.models.restaurant import Restaurant

_bcrypt = CryptContext(schemes=["bcrypt"], deprecated="auto")
_PHOTO = "https://images.unsplash.com/photo-{}?w=600&h=400&fit=crop"

# ── Owner accounts ────────────────────────────────────────────────────────────

OWNERS = [
    dict(
        first_name="Marek",
        last_name="Novák",
        user_email="owner1@reservelt.sk",
        user_password=_bcrypt.hash("Owner123!"),
        role=UserRole.RESTAURANT_OWNER,
        email_verified=True,
    ),
    dict(
        first_name="Jana",
        last_name="Kováčová",
        user_email="owner2@reservelt.sk",
        user_password=_bcrypt.hash("Owner123!"),
        role=UserRole.RESTAURANT_OWNER,
        email_verified=True,
    ),
]

# ── Restaurant data ───────────────────────────────────────────────────────────

RESTAURANTS = [
    dict(
        owner_email="owner1@reservelt.sk",
        slug="koliba-salash-bratislava",
        name="Koliba Salash",
        description=(
            "Traditional Slovak cuisine in a rustic mountain lodge atmosphere. "
            "Famous for bryndzové halušky, roast duck, and hearty game dishes "
            "sourced from local farms around the Carpathian region."
        ),
        cuisine="Slovak",
        price_range=2,
        phone_number="+421 2 1234 5678",
        email="info@kolibasalash.sk",
        address="Kolibská 12, Bratislava – Nové Mesto",
        city="Bratislava",
        country="Slovakia",
        latitude=48.1586,
        longitude=17.1177,
        cover_image=_PHOTO.format("1414235077428-338989a2e8c0"),
        rating=4.6,
        review_count=212,
    ),
    dict(
        owner_email="owner1@reservelt.sk",
        slug="la-piazza-bratislava",
        name="La Piazza",
        description=(
            "Authentic Italian trattoria in the heart of Bratislava's old town. "
            "Handmade pasta, wood-fired pizza, and a carefully curated selection "
            "of Italian wines — just like a proper nonna would approve."
        ),
        cuisine="Italian",
        price_range=3,
        phone_number="+421 2 9876 5432",
        email="ciao@lapiazza.sk",
        address="Hlavné námestie 5, Bratislava – Staré Mesto",
        city="Bratislava",
        country="Slovakia",
        latitude=48.1436,
        longitude=17.1097,
        cover_image=_PHOTO.format("1565299624946-b28f40a0ae38"),
        rating=4.4,
        review_count=348,
    ),
    dict(
        owner_email="owner2@reservelt.sk",
        slug="u-zlateho-srnca-kosice",
        name="U Zlatého Srnca",
        description=(
            "A beloved Košice institution serving hearty Slovak and Carpathian "
            "specialties since 1978. Must-try: svíčková, kapustnica, and local "
            "venison prepared the traditional way."
        ),
        cuisine="Slovak",
        price_range=2,
        phone_number="+421 55 623 4789",
        email="restauracia@zlatesrnec.sk",
        address="Hlavná 48, Košice – Staré Mesto",
        city="Košice",
        country="Slovakia",
        latitude=48.7194,
        longitude=21.2581,
        cover_image=_PHOTO.format("1552566626-52f8b828a9f3"),
        rating=4.7,
        review_count=189,
    ),
    dict(
        owner_email="owner1@reservelt.sk",
        slug="sushi-zen-bratislava",
        name="Sushi Zen",
        description=(
            "Premium Japanese dining in a serene minimalist setting. "
            "Omakase menus, fresh daily sashimi, specialty rolls, and "
            "a thoughtful sake and Japanese whisky selection."
        ),
        cuisine="Japanese",
        price_range=3,
        phone_number="+421 2 5555 0011",
        email="hello@sushizen.sk",
        address="Obchodná 22, Bratislava – Staré Mesto",
        city="Bratislava",
        country="Slovakia",
        latitude=48.1466,
        longitude=17.1127,
        cover_image=_PHOTO.format("1517248135467-4c7edcad34c4"),
        rating=4.5,
        review_count=276,
    ),
    dict(
        owner_email="owner1@reservelt.sk",
        slug="steakhouse-maverick-bratislava",
        name="Steakhouse Maverick",
        description=(
            "The finest dry-aged steaks in Slovakia, sourced from premium local "
            "and international farms. Expert sommeliers on hand to pair your cut "
            "with the perfect wine. Private dining room available."
        ),
        cuisine="Steakhouse",
        price_range=4,
        phone_number="+421 2 8888 7777",
        email="reservations@maverick.sk",
        address="Panská 3, Bratislava – Staré Mesto",
        city="Bratislava",
        country="Slovakia",
        latitude=48.1446,
        longitude=17.1067,
        cover_image=_PHOTO.format("1544025162-d76538ad2af4"),
        rating=4.8,
        review_count=154,
    ),
    dict(
        owner_email="owner2@reservelt.sk",
        slug="korzo-cafe-zilina",
        name="Korzo Café & Restaurant",
        description=(
            "A lively café and restaurant on Žilina's pedestrian zone. "
            "International menu, all-day breakfast, craft cocktails, and "
            "live music every Friday and Saturday evening."
        ),
        cuisine="International",
        price_range=2,
        phone_number="+421 41 700 1234",
        email="korzo@korzozilina.sk",
        address="Mariánske námestie 7, Žilina – Centrum",
        city="Žilina",
        country="Slovakia",
        latitude=49.2231,
        longitude=18.7394,
        cover_image=_PHOTO.format("1424847651672-bf20a4b0982b"),
        rating=4.3,
        review_count=423,
    ),
    dict(
        owner_email="owner2@reservelt.sk",
        slug="pivaren-stary-mlyn-trnava",
        name="Piváreň Starý Mlyn",
        description=(
            "Historic brewery pub in a restored 19th-century mill in the heart "
            "of Trnava. Home to craft lagers brewed on-site, Slovak pub classics, "
            "and the best fried cheese in the region."
        ),
        cuisine="Slovak",
        price_range=1,
        phone_number="+421 33 551 2890",
        email="info@starymlyn.sk",
        address="Trojičné námestie 2, Trnava",
        city="Trnava",
        country="Slovakia",
        latitude=48.3769,
        longitude=17.5874,
        cover_image=_PHOTO.format("1466978913421-da2122536e4e"),
        rating=4.2,
        review_count=567,
    ),
    dict(
        owner_email="owner2@reservelt.sk",
        slug="paprica-nitra",
        name="Paprica",
        description=(
            "Contemporary Mediterranean restaurant in central Nitra blending "
            "Spanish, Greek, and Italian flavours. Tapas-style sharing plates, "
            "fresh seafood flown in twice weekly, and natural wines."
        ),
        cuisine="Mediterranean",
        price_range=3,
        phone_number="+421 37 650 0321",
        email="paprica@papricanitra.sk",
        address="Štefánikova trieda 10, Nitra",
        city="Nitra",
        country="Slovakia",
        latitude=48.3069,
        longitude=18.0838,
        cover_image=_PHOTO.format("1504674900247-0877df9cc836"),
        rating=4.5,
        review_count=198,
    ),
    dict(
        owner_email="owner1@reservelt.sk",
        slug="green-bites-bratislava",
        name="Green Bites",
        description=(
            "Bratislava's favourite plant-based restaurant. Creative vegan and "
            "vegetarian dishes using seasonal Slovak produce. Power bowls, "
            "raw desserts, and cold-pressed juices in a bright, welcoming space."
        ),
        cuisine="Vegetarian",
        price_range=2,
        phone_number="+421 2 3333 4444",
        email="hello@greenbites.sk",
        address="Laurinská 14, Bratislava – Staré Mesto",
        city="Bratislava",
        country="Slovakia",
        latitude=48.1456,
        longitude=17.1087,
        cover_image=_PHOTO.format("1484723091739-30a262b29d6a"),
        rating=4.6,
        review_count=301,
    ),
    dict(
        owner_email="owner2@reservelt.sk",
        slug="casa-morena-kosice",
        name="Casa Morena",
        description=(
            "Spanish and Latin-inspired restaurant in central Košice. Paella, "
            "churros, homemade sangria, and an extensive tapas menu. "
            "Flamenco nights every Friday — reservations strongly recommended."
        ),
        cuisine="Spanish",
        price_range=3,
        phone_number="+421 55 772 2100",
        email="hola@casamorena.sk",
        address="Alžbetina 19, Košice – Staré Mesto",
        city="Košice",
        country="Slovakia",
        latitude=48.7144,
        longitude=21.2631,
        cover_image=_PHOTO.format("1568901346375-23c9450c58cd"),
        rating=4.4,
        review_count=143,
    ),
]

# ── Runner ────────────────────────────────────────────────────────────────────

def run() -> None:
    db = SessionLocal()
    try:
        # 1. Ensure owner users exist
        owner_id_map: dict[str, int] = {}
        for data in OWNERS:
            user = db.query(User).filter(User.user_email == data["user_email"]).first()
            if not user:
                user = User(**data)
                db.add(user)
                db.commit()
                db.refresh(user)
                print(f"  [+] Owner created : {user.user_email}")
            else:
                print(f"  [=] Owner exists  : {user.user_email}")
            owner_id_map[user.user_email] = user.id

        print()

        # 2. Seed restaurants (skip existing slugs)
        created = skipped = 0
        for data in RESTAURANTS:
            owner_email = data["owner_email"]
            fields = {k: v for k, v in data.items() if k != "owner_email"}

            if db.query(Restaurant).filter(Restaurant.slug == fields["slug"]).first():
                print(f"  [=] Skipped (exists) : {fields['slug']}")
                skipped += 1
                continue

            restaurant = Restaurant(**fields, owner_id=owner_id_map[owner_email])
            db.add(restaurant)
            db.commit()
            print(f"  [+] Created : {fields['name']} — {fields['city']}")
            created += 1

        print(f"\nDone — {created} created, {skipped} skipped.")

    finally:
        db.close()


if __name__ == "__main__":
    run()
