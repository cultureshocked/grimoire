CREATE TABLE "auth" (
	"id"	INTEGER,
	"username"	TEXT UNIQUE,
	"password"	TEXT,
	PRIMARY KEY("id")
);

CREATE TABLE "posts" (
	"id"	INTEGER,
	"title"	TEXT,
	"body"	TEXT,
	"deleted"	INTEGER,
	"slug"	TEXT UNIQUE,
	"date"	INTEGER,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE "posts_tags" (
	"post_id"	INTEGER,
	"tag_id"	INTEGER,
	PRIMARY KEY("post_id","tag_id"),
	CONSTRAINT "post" FOREIGN KEY("post_id") REFERENCES "posts"("id"),
	CONSTRAINT "tag" FOREIGN KEY("tag_id") REFERENCES "tags"("id")
);

CREATE TABLE sqlite_sequence(name,seq);

CREATE TABLE "tags" (
	"id"	INTEGER,
	"name"	TEXT UNIQUE,
	PRIMARY KEY("id" AUTOINCREMENT)
);


