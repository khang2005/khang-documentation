# Component Breakdown

## Sensor Nodes

Sensor nodes are responsible for collecting environmental data and transmitting it to the gateway.

Each node consists of:
- ESP32 microcontroller  
- connected sensors such as temperature, humidity, or air quality  
- wireless communication via WiFi or LoRa  

Responsibilities:
- read sensor values at defined intervals  
- format data into structured messages  
- transmit data to the gateway  
- operate efficiently with optional low power modes  

---

## Gateway

The gateway is the central system that connects sensor nodes to backend services.

Hardware:
- Raspberry Pi 4 or Raspberry Pi 5  
- optional SSD for improved reliability  
- touchscreen display for local dashboard  

Responsibilities:
- receive incoming wireless data  
- route messages to backend services  
- run Docker for container orchestration  
- host local dashboard interface  
- provide network access for mobile devices  

---

## Backend Services

Backend services are deployed as containerized applications managed by Docker.

Core services:
- **MQTT Broker**  
  handles incoming messages from sensor nodes  

- **Ingestion Service**  
  validates and processes incoming data  

- **Database**  
  stores structured sensor data for querying and visualization  

- **Dashboard Service**  
  serves the web interface for data visualization  

Responsibilities:
- decouple data flow between components  
- ensure reliable data handling  
- support real time and historical queries  

---

## User Interface

The user interface provides access to system data.

Components:
- web based dashboard  
- touchscreen display connected to gateway  
- mobile browser access  

Features:
- real time sensor readings  
- historical data visualization  
- system status monitoring  
