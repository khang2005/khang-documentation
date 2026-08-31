# Technology Stack

## Sensor Layer

ESP32 microcontroller  
C or C++ firmware  
ESP IDF or Arduino framework  

**Responsibilities**:  
- sensor data collection  
- message formatting  
- wireless transmission  

---

## Communication Layer

WiFi or LoRa for wireless transmission  
MQTT protocol for message delivery  

**Responsibilities**:  
- reliable data transfer  
- decoupled communication between nodes and services  

---

## Gateway Layer

Raspberry Pi running Linux  
Docker for container orchestration  

**Responsibilities**:  
- manage services  
- route and process incoming data  
- provide local system control  

---

## Backend Layer

MQTT broker  
ingestion service using FastAPI or Go  
PostgreSQL database  

**Responsibilities**:  
- message handling  
- data validation and storage  
- API for dashboard access  

---

## Frontend Layer

web based dashboard  
React or simple HTML interface  

**Responsibilities**:  
- display real time data  
- visualize historical trends  
- provide user interaction  

---

## Orchestration

Docker Compose

**Responsibilities**:  
- manage container lifecycle  
- ensure service availability  
- support future scaling
