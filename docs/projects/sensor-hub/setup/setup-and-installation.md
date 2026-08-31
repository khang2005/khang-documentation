# Setup and Installation Guide

## Prerequisites

**Hardware:**
- Raspberry Pi 4 or Raspberry Pi 5  
- power supply (5V 3A for Pi 4, 5V 5A for Pi 5)  
- microSD card or SSD  
- ESP32 development board  
- sensors such as BME280 or DHT22  
- optional LoRa modules  

**Software:**
- Raspberry Pi OS  
- Docker  
- Git  

---

## Gateway Setup

1. Flash Raspberry Pi OS to microSD or SSD  
2. Boot Raspberry Pi and connect to network  
3. Update system packages:

```bash
sudo apt update && sudo apt upgrade -y
```

Install Docker:

```bash
curl -fsSL https://get.docker.com | sh
```

Verify Docker installation:

```bash
sudo docker run hello-world
```

---

## Deploy Core Services

Run the containerized backend services:

- MQTT broker  
- ingestion service  
- database  
- dashboard  

Example deployment command:

```bash
sudo docker compose up -d
```

Verify all services are running:

```bash
sudo docker compose ps
```

---

## Sensor Node Setup

Install development environment:  
Arduino IDE or ESP IDF  

Connect sensor to ESP32:  
follow sensor specific wiring  

Write firmware to:  
- read sensor values  
- format message  
- send data via WiFi or LoRa  

Upload firmware to ESP32  
Verify data transmission to gateway  

---

## Dashboard Access

**Local access**:  
open browser on Raspberry Pi touchscreen  
navigate to dashboard URL  

**Mobile access**:  
connect to same network  
open gateway IP address in browser  

---

## Verification

Confirm system operation:  
- sensor node sends data  
- gateway receives messages  
- backend services process data  
- dashboard displays real time values  

Use logs for debugging:

```bash
sudo docker compose logs
```

---

## Troubleshooting

**no sensor data**  
check firmware and network connection  

**services not running**  
check Docker status and logs  

**dashboard not accessible**  
verify service and network configuration  

**unstable system**  
check power supply and cooling  

---

## Next Steps

After initial setup:  
- add more sensor nodes  
- optimize power usage  
- enable remote access  
- integrate LoRa or advanced wireless features
