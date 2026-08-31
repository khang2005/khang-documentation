# System Architecture

## High Level Architecture

![System Architecture Diagram](../assets/images/system-architecture-diagram.png)

```
[ Sensor Nodes ]
↓ (WiFi or LoRa)
[ Gateway (Raspberry Pi) ]
↓
[ Backend Services ]
├── MQTT Broker
├── Ingestion Service
├── Database
└── Dashboard Service
↓
[ Touchscreen Display ] + [ Mobile Browser ]
```

---

## Architecture Description

The system is composed of three main layers:

**Sensor Layer**  
Wireless sensor nodes collect environmental data such as temperature, humidity, or air quality. Each node transmits data periodically using WiFi or LoRa.

**Gateway Layer**  
A Raspberry Pi acts as the central gateway. It receives incoming data from all sensor nodes and routes it to backend services. The gateway runs containerized applications via Docker.

**Service Layer**  
Backend services are deployed as containers running on the gateway. These services handle message brokering, data processing, storage, and dashboard delivery.

**User Interface Layer**  
A web based dashboard displays real time and historical sensor data. The dashboard is accessible through a touchscreen connected to the gateway and through mobile devices via a browser.
