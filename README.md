# grimoire

This is my personal blog. It's build with SolidJS (SolidStart) and Actix.

## Building

```sh
cd src/api
cargo build --release
cd ../app
pnpm build
```

## Notes
### API
The API runs on port 8080 by default. 

It reads a `blog.db` Sqlite3 database located in your home directory by default. You can change its location by modifying line 95 of `src/api/src/main.rs`.

You can initialize the database's tables by executing the provided `.sql` file in the `src/api` directory.

### Frontend
The frontend runs on port 3000 by default and assumes the API is found at `localhost:8080`. This behaviour will be changed in the future to rely on a URL provided in the application's `.env` file.

Be sure to generate a unique key for signing/encrypting sessions:
```sh
echo "VITE_SESSION_KEY = '$(openssl rand -base64 32)'" > src/app/.env
```
Note that environment variables prefixed with `VITE_` can only be read by the server, and any client code attempting to read them will receive an `undefined` result.

## License

MIT
