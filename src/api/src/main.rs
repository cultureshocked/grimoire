use actix_web::{middleware, get, post, delete, put, web, App, HttpResponse, HttpServer, Responder, Error as AWError};
use actix_web::http::header::ContentType;
use actix_cors::Cors;
use r2d2_sqlite::SqliteConnectionManager;
use env_logger;

mod db;
use db::{Pool, Queries};

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("API v1")
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

#[get("/posts")]
async fn posts(pool: web::Data<Pool>) -> Result<HttpResponse, AWError> {
    let result = db::execute(&pool, Queries::GetPosts).await?;
    Ok(HttpResponse::Ok()
        .insert_header(ContentType::json())
        .body(result))
}

#[get("/posts/{id}")]
async fn read_post(pool: web::Data<Pool>, path: web::Path<i32>) -> Result<HttpResponse, AWError> {
    let id = path.into_inner();
    let result = db::execute(&pool, Queries::ReadPost(id)).await?;
    Ok(HttpResponse::Ok().insert_header(ContentType::json()).body(result))
}

#[get("/posts/by-slug/{slug}")]
async fn by_slug(pool: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, AWError> {
    let slug = path.into_inner();
    let result = db::execute(&pool, Queries::ReadPostBySlug(slug)).await?;
    Ok(HttpResponse::Ok().insert_header(ContentType::json()).body(result))
}

#[get("/posts/by-tag/{tag}")]
async fn by_tag(pool: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, AWError> {
    let tag = path.into_inner();
    let result = db::execute(&pool, Queries::GetPostsByTag(tag)).await?;
    Ok(HttpResponse::Ok().insert_header(ContentType::json()).body(result))
}

#[get("/posts/tags/{slug}")]
async fn post_tags(pool: web::Data<Pool>, path: web::Path<String>) -> Result<HttpResponse, AWError> {
    let slug = path.into_inner();
    let result = db::execute(&pool, Queries::GetTagsOfPost(slug)).await?;
    Ok(HttpResponse::Ok().insert_header(ContentType::json()).body(result))
}

#[post("/posts/new")]
async fn new_post(pool: web::Data<Pool>, req_body: String) -> Result<HttpResponse, AWError> {
    db::execute(&pool, Queries::NewPost(req_body)).await?;
    Ok(HttpResponse::Created().into())
}

#[put("/posts/update")]
async fn edit_post(pool: web::Data<Pool>, req_body: String) -> Result<HttpResponse, AWError> {
    let result = db::execute(&pool, Queries::UpdatePost(req_body)).await?;
    Ok(HttpResponse::Ok().body(result))
}

#[delete("/posts/{id}")]
async fn delete_post(pool: web::Data<Pool>, path: web::Path<i32>) -> Result<HttpResponse, AWError> {
    let id = path.into_inner();
    db::execute(&pool, Queries::DeletePost(id)).await?;
    Ok(HttpResponse::MovedPermanently().into())
}

#[get("/tags")]
async fn tags(pool: web::Data<Pool>) -> Result<HttpResponse, AWError> {
    let result = db::execute(&pool, Queries::GetTags).await?;
    Ok(HttpResponse::Ok().insert_header(ContentType::json()).body(result))
}

#[post("/auth")]
async fn auth(pool: web::Data<Pool>, req_body: String) -> Result<HttpResponse, AWError> {
    let result = db::execute(&pool, Queries::AuthenticateAdmin(req_body)).await?;
    Ok(HttpResponse::Ok().insert_header(ContentType::json()).body(result))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::new().default_filter_or("info"));
    let mut blogdb = std::env::var("HOME").unwrap();
    blogdb.push_str("/blog.db"); 

    let manager = SqliteConnectionManager::file(blogdb);
    let pool = Pool::new(manager).unwrap();

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .send_wildcard();
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .wrap(middleware::Logger::new("%a -- %r: %s (%b bytes), served in %Dms"))
            .wrap(cors)
            .service(hello)
            .service(echo)
            .service(posts)
            .service(read_post)
            .service(new_post)
            .service(edit_post)
            .service(delete_post)
            .service(by_slug)
            .service(tags)
            .service(by_tag)
            .service(post_tags)
            .service(auth)
    })
    .bind(("127.0.0.1", 8080))?
    .workers(2)
    .run()
    .await
}
