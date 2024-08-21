CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL,
    poster_path VARCHAR(50) NOT NULL;
);

CREATE TABLE movies (
    id SERIAL PRIMARY KEY,           
    user_id INTEGER REFERENCES users(id),
    languages VARCHAR(5)[] NOT NULL,
    genres INTEGER[] NOT NULL
);