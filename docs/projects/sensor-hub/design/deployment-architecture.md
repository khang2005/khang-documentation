# Deployment Architecture

## Docker Service Structure

The system runs backend services as Docker containers on the gateway device.

```
Gateway (Raspberry Pi)
├── mqtt-container
├── ingest-api-container
├── database-container
└── dashboard-container
```

---

## Service Responsibilities

- **mqtt-container**  
  handles incoming sensor messages  

- **ingest-api-container**  
  processes and validates data before storage  

- **database-container**  
  stores structured sensor data  

- **dashboard-container**  
  serves the web interface  

---

## Networking

- services communicate internally using container networking  
- external access provided through local network or secure tunnel  
- gateway acts as entry point for all system interactions  
