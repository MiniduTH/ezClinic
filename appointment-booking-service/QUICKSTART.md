# Quick Start Guide - ezClinic Appointment Service

## Prerequisites Check

✅ Docker Desktop installed and running  
✅ `.env` file exists with your credentials  
✅ Ports 3004, 5672, 15672 are available  

## Option 1: Using Batch Scripts (Windows - Easiest)

### Start Everything

```bash
build-and-run.bat
```

This will:
- Stop any existing containers
- Build the Docker image
- Start RabbitMQ and Appointment Service
- Show you the access URLs

### View Live Logs

```bash
view-logs.bat
```

### Stop Services

```bash
stop-services.bat
```

## Option 2: Using Docker Compose (Cross-Platform)

### Start Services

```bash
docker-compose up --build -d
```

### View Logs

```bash
docker-compose logs -f
```

### Stop Services

```bash
docker-compose down
```

## Verify Services are Running

### Check Container Status

```bash
docker ps
```

You should see:
- `ezclinic-rabbitmq` (running)
- `ezclinic-appointment-service` (running)

### Test the API

```bash
curl http://localhost:3004/api/appointments/doctors/search?specialty=Cardiology
```

### Access RabbitMQ Management UI

Open browser: http://localhost:15672  
Login: `guest` / `guest`

## Common Issues

### "Docker is not running"
- Start Docker Desktop
- Wait for it to fully start (whale icon in system tray)

### "Port already in use"
- Check what's using the port: `netstat -ano | findstr :3004`
- Stop the conflicting service or change the port in docker-compose.yml

### "Cannot connect to database"
- Verify `.env` file has correct Supabase credentials
- Check if your IP is whitelisted in Supabase dashboard

### "RabbitMQ connection refused"
- Wait 30 seconds for RabbitMQ to fully start
- Check logs: `docker-compose logs rabbitmq`

## What's Running?

| Service | Port | URL |
|---------|------|-----|
| Appointment API | 3004 | http://localhost:3004/api/appointments |
| RabbitMQ Broker | 5672 | amqp://localhost:5672 |
| RabbitMQ Management | 15672 | http://localhost:15672 |

## Next Steps

1. Test appointment booking via Postman (see `ezClinic_Postman_Collection.json`)
2. Monitor RabbitMQ messages in the management UI
3. Check application logs for any errors
4. Integrate with other microservices (Doctor, Patient, Notification)

## Need Help?

- Check `README-DOCKER.md` for detailed documentation
- View logs: `docker-compose logs -f appointment-service`
- Restart services: `docker-compose restart`
