CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    display_name VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(50) NOT NULL
);