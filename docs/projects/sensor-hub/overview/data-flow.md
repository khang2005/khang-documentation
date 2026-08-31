# Data Flow

## Step by Step Flow

1. Sensor Node reads sensor value
2. Format message
3. Transmit wirelessly
4. Gateway receives message
5. MQTT broker queues message
6. Ingestion service processes data
7. Database stores data
8. Dashboard queries data
9. User views data

---

## Description

Sensor nodes periodically collect data and transmit it to the gateway using a wireless protocol. The gateway receives the data and forwards it to a message broker, which decouples communication between components.

The ingestion service consumes messages from the broker, validates the data, and stores it in the database. The dashboard service retrieves stored data and presents it to the user in real time and historical formats.

---

## Design Considerations

- asynchronous message handling for reliability  
- separation between data producers and consumers  
- minimal latency from sensor to dashboard  
- ability to buffer or retry on failure
