use actix_web::{error, web, Error};
// use rusqlite::Statement;
use serde::{Deserialize, Serialize};
use slugify::slugify;
use sha2::{Sha256, Digest};
use hex;

pub type Pool = r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>;
pub type Connection = r2d2::PooledConnection<r2d2_sqlite::SqliteConnectionManager>;

#[derive(Serialize, Deserialize)]
pub struct Post {
    id: i32, 
    title: String,
    body: String,
    deleted: bool,
    slug: String,
    date: u64
}

#[derive(Serialize, Deserialize)]
pub struct Tag {
    id: i32,
    name: String,
}

#[derive(Serialize, Deserialize)]
pub struct UninsertedPost {
    title: String,
    body: String,
}

#[derive(Serialize, Deserialize)]
pub struct PostWithTags {
    p: Post,
    t: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct AuthInfo {
    username: String,
    password: String,
}

pub enum Queries {
    GetPosts,
    GetTags,
    ReadPost(i32),
    ReadPostBySlug(String),
    GetPostsByTag(String),
    GetTagsOfPost(String),
    NewPost(String),
    UpdatePost(String),
    DeletePost(i32),
    AuthenticateAdmin(String),
}

pub async fn execute(pool: &Pool, query: Queries) -> Result<String, Error> {
    let pool = pool.clone(); // shadow pool as it may extend the lifetime of main

    let conn = web::block(move || pool.get()) // take ownership of the cloned pool inside the
                                              // web::block, which is required to ensure this
                                              // execution function running on the main thread does
                                              // not hinder the main thread from responding to
                                              // other simultaneous requests
        .await?
        .map_err(error::ErrorInternalServerError)?; // internal server error if no connection can
                                                    // be acquired
    
    web::block(move || {
        match query {
            Queries::GetPosts => get_posts(conn),
            Queries::GetTags => get_tags(conn),
            Queries::ReadPost(n) => retrieve_post(conn, n),
            Queries::NewPost(data) => create_post(conn, data),
            Queries::UpdatePost(data) => update_post(conn, data),
            Queries::DeletePost(id) => destroy_post(conn, id),
            Queries::ReadPostBySlug(slug) => retrieve_post_by_slug(conn, slug),
            Queries::GetPostsByTag(tag) => get_posts_by_tag(conn, tag),
            Queries::GetTagsOfPost(slug) => get_tags_of_post(conn, slug),
            Queries::AuthenticateAdmin(data) => authenticate(conn, data),
        }
    })
        .await?
        .map_err(error::ErrorInternalServerError) // returns the result of this block
}

fn get_posts(conn: Connection) -> Result<String, rusqlite::Error> {
    let mut sql = conn.prepare("SELECT id,title,body,deleted,slug,date FROM posts WHERE deleted = 0 ORDER BY date DESC LIMIT 10")?;
    let titles: Vec<Post> = sql.query_map([], |row| {
        Ok(Post {
            id: row.get(0)?,
            title: row.get(1)?,
            body: row.get(2)?,
            deleted: match row.get(3)? {
                0 => false,
                _ => true,
            },
            slug: row.get(4)?,
            date: row.get(5)?,
        })
    })
        .and_then(Iterator::collect).unwrap();

    Ok(serde_json::to_string(&titles).unwrap())
}

fn retrieve_post(conn: Connection, id: i32) -> Result<String, rusqlite::Error> {
    let post = conn.query_row("SELECT * FROM posts WHERE id = ?1", [id], |row| {
        Ok(Post {
            id: row.get(0)?,
            title: row.get(1)?,
            body: row.get(2)?,
            deleted: match row.get(3)? {
                0 => false,
                _ => true
            },
            slug: row.get(4)?,
            date: row.get(5)?,
        })
    }).unwrap();
    Ok(serde_json::to_string(&post).unwrap())
}

fn retrieve_post_by_slug(conn: Connection, slug: String) -> Result<String, rusqlite::Error> {
    let post: Post = conn.query_row(
        "SELECT * FROM posts WHERE slug = :slug", 
        rusqlite::named_params! { ":slug": slug },
        |row| {
            Ok(Post {
                id: row.get(0)?,
                title: row.get(1)?,
                body: row.get(2)?,
                deleted: match row.get(3)? {
                    0 => false,
                    _ => true
                },
                slug: row.get(4)?,
                date: row.get(5)?,
            })
        }).unwrap();
    Ok(serde_json::to_string(&post).unwrap())
}

fn create_post(conn: Connection, data: String) -> Result<String, rusqlite::Error> {
    let post: UninsertedPost = serde_json::from_str(&data).unwrap();
    let slug = slugify!(&post.title);
    let mut sql = conn.prepare("INSERT INTO posts(title, body, slug) VALUES(:title, :body, :slug)")?;
    sql.execute(rusqlite::named_params! {
        ":title": post.title,
        ":body": post.body,
        ":slug": slug
    })?;
    Ok("".to_string())
}

fn update_post(mut conn: Connection, data: String) -> Result<String, rusqlite::Error> {
    let post: PostWithTags = serde_json::from_str(&data).unwrap();
    let tx = conn.transaction()?;
    {
        let mut sql = tx.prepare("UPDATE posts SET title = :title, body = :body, slug = :slug WHERE id = :id")?;
        sql.execute(rusqlite::named_params! {
            ":id": &post.p.id,
            ":title": &post.p.title,
            ":body": &post.p.body,
            ":slug": slugify!(&post.p.title)
        })?;
    }
    
    // inserting any tags necessary
    {
        let mut sql = tx.prepare("INSERT OR IGNORE INTO tags(name) VALUES(:name)")?;
        for name in &post.t {
            sql.execute(rusqlite::named_params! {":name": name})?;
        }
    }

    // updating intersection table for posts_tags
    // TODO: stop using subquery lol
    {
        let mut sql = tx.prepare("INSERT OR IGNORE INTO posts_tags(post_id,tag_id) VALUES(:pid, (SELECT id FROM tags WHERE name = :name))")?;
        for name in &post.t {
            sql.execute(rusqlite::named_params! {":pid": &post.p.id, ":name": name})?;
        }

    }

    tx.commit()?;
    Ok(slugify!(&post.p.title))
}

fn destroy_post(conn: Connection, id: i32) -> Result<String, rusqlite::Error> {
    conn.execute("UPDATE posts SET deleted = 1 WHERE id = ?1", [id])?;
    Ok("".to_string())
}

fn get_tags(conn: Connection) -> Result<String, rusqlite::Error> {
    let mut sql = conn.prepare("SELECT * FROM tags")?;
    let tags: Vec<Tag> = sql.query_map([], |row| {
        Ok(Tag {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    }).and_then(Iterator::collect).unwrap();
    Ok(serde_json::to_string(&tags).unwrap())
}

fn get_posts_by_tag(conn: Connection, tag: String) -> Result<String, rusqlite::Error> {
    let mut sql = conn.prepare(
        "SELECT p.id,p.title,p.body,p.deleted,p.slug,p.date \
            FROM tags t \
            INNER JOIN posts_tags pt ON pt.tag_id = t.id \
            INNER JOIN posts p ON pt.post_id = p.id \
            WHERE t.name= :tag \
            ORDER BY p.date DESC"
    )?;
    let posts: Vec<Post> = sql.query_map(rusqlite::named_params! { ":tag": tag }, |row| {
        Ok(Post {
                id: row.get(0)?,
                title: row.get(1)?,
                body: row.get(2)?,
                deleted: match row.get(3)? {
                    0 => false,
                    _ => true
                },
                slug: row.get(4)?,
                date: row.get(5)?,
        })
    }).and_then(Iterator::collect).unwrap();
    Ok(serde_json::to_string(&posts).unwrap())
}

fn get_tags_of_post(conn: Connection, slug: String) -> Result<String, rusqlite::Error> {
    let mut sql = conn.prepare(
        "SELECT tags.name FROM tags \
        INNER JOIN posts_tags pt ON pt.tag_id = tags.id \
        INNER JOIN posts p ON p.id = pt.post_id \
        WHERE p.slug = :slug"
    )?;
    let tags: Vec<String> = sql.query_map(rusqlite::named_params! { ":slug": slug }, |row| {
        Ok(row.get(0)?)
    }).and_then(Iterator::collect).unwrap();
    Ok(serde_json::to_string(&tags).unwrap())
}

fn authenticate(conn: Connection, data: String) -> Result<String, rusqlite::Error> {
    let user_data: AuthInfo = serde_json::from_str(&data).unwrap();
    println!("{}", hex::encode(Sha256::digest(user_data.password.as_bytes())));
    let mut sql = conn.prepare(
        "SELECT id FROM auth \
            WHERE auth.username = :username AND \
                auth.password = :password"
    )?;
    let id: i32 = sql.query_row(rusqlite::named_params! { 
        ":username": user_data.username,
        ":password": hex::encode(Sha256::digest(user_data.password.as_bytes())),
        }, |row| {
            Ok(row.get(0)?)
        }).unwrap_or_else(|_| 0);
    Ok(serde_json::to_string(&id).unwrap())
}
