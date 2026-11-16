from flask_sqlalchemy import SQLAlchemy

import os

SCHEMA = os.environ.get("SCHEMA")

# The Postgres schema prefix only makes sense on Postgres. If production is
# ever pointed at SQLite (the old demo setup) we fall back to plain table
# names instead of crashing on boot.
_db_url = os.environ.get("DATABASE_URL", "")
environment = os.getenv("FLASK_ENV")
if environment == "production" and (_db_url.startswith("sqlite") or not SCHEMA):
    environment = "development"


db = SQLAlchemy()

# helper function for adding prefix to foreign key column references in production
def add_prefix_for_prod(attr):
    if environment == "production":
        return f"{SCHEMA}.{attr}"
    else:
        return attr
