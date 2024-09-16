CREATE TABLE users (
    id SERIAL PRIMARY KEY, 15 / 18
    display_name VARCHAR(50) NOT NULL, Mark / Sarah
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL,
    firebase_uid VARCHAR(50) NOT NULL;
);

CREATE TABLE movies (
    id SERIAL PRIMARY KEY,           
    languages VARCHAR(5)[] NOT NULL,
    genres INTEGER[] NOT NULL
    firebase_uid VARCHAR(255) REFERENCES users(firebase_uid) ON DELETE CASCADE
);