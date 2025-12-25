import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import os
from dotenv import load_dotenv
from urllib.parse import urlparse

load_dotenv()


def create_database():
    # Get database URL from .env
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL not found in .env")
        return

    # Parse the URL
    result = urlparse(db_url)
    username = result.username
    password = result.password
    host = result.hostname
    port = result.port
    db_name = result.path[1:]  # remove leading slash

    print(f"Attempting to create database: {db_name}")

    try:
        # Connect to default 'postgres' database
        con = psycopg2.connect(
            dbname="postgres", user=username, host=host, password=password, port=port
        )

        con.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cur = con.cursor()

        # Check if database exists
        cur.execute(f"SELECT 1 FROM pg_catalog.pg_database WHERE datname = '{db_name}'")
        exists = cur.fetchone()

        if not exists:
            cur.execute(f"CREATE DATABASE {db_name}")
            print(f"Database {db_name} created successfully!")
        else:
            print(f"Database {db_name} already exists.")

        cur.close()
        con.close()

    except Exception as e:
        print(f"Error creating database: {e}")


if __name__ == "__main__":
    create_database()
