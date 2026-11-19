# rwatch-console

Alert console for **rwatch**, the network IDS of the **sec-lab-iot** lab.
It receives rwatch alerts over HTTP, stores them, and displays them.

This console belongs to *sec-lab-iot, Part 2: Defense & IAM*. It contains no
detection logic: detection belongs to rwatch.

Status: work in progress.

## Architecture

```
(rwatch) --POST /api/alerts + Bearer--> (nginx) --/api--> (backend NestJS) --> (SQLite volume)
                                           |
                                           +--> (frontend Angular, static files)
```

- `frontend/`: Angular app, served by nginx, which also proxies `/api` to the backend.
- `backend/`: NestJS ingestion and read API; SQLite through `node:sqlite`.
- The backend is not published on the host; only nginx is, on a single interface.

## Quick start

```sh
cp .env.example .env              # then set INGEST_TOKEN (openssl rand -hex 32)
docker compose up --build -d
```

Replay the sample alerts produced by rwatch:

```sh
JETON=<token> URL=http://127.0.0.1:8080/api/alerts ./scripts/replay-alerts.sh
```

## Alert contract

The alert format, transport and authentication are defined by rwatch.
This console implements that contract and does not reinterpret it.

## License

MIT