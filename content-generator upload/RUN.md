# Run MoneyPrinterTurbo

## Start

```bash
docker compose up -d
```

http://localhost:3000/strategy?brandCardId=49b5f3fc-b847-4959-9ead-d8a03345c22d

First run builds the image — takes a few minutes.

## Access

| Service | URL                   |
| ------- | --------------------- |
| WebUI   | http://127.0.0.1:8501 |
| API     | http://127.0.0.1:8080 |

## Stop

```bash
docker compose down
```

## Logs

```bash
docker compose logs -f
```
