# Docker Instructions

## Run the site
```bash
docker compose up --build -d
```
Access at [http://localhost:8080](http://localhost:8080)

## View logs
```bash
docker compose logs -f web
```

## Stop and remove
```bash
docker compose down
```

## Change to port 80
Edit `docker-compose.yml`:
```yaml
ports:
  - "80:80"
```
Then `docker compose up --build -d`

## Clean up images
```bash
docker compose down --rmi all
