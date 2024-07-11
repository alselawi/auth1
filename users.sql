PRAGMA defer_foreign_keys = TRUE;

DROP TABLE IF EXISTS [users];

CREATE TABLE [users] (
    "id" text PRIMARY KEY,
    "name" text,
    "email" text,
    "role" text,
    "prefix" text,
    "ecc" text,
    "lcc" text,
    confirmed INTEGER,
    timestamp text
);

INSERT INTO
    users
VALUES
(
        '1',
        'Ali',
        'ali.a.saleem@outlook.com',
        'admin',
        'ali',
        NULL,
        NULL,
        1,
        NULL
    );