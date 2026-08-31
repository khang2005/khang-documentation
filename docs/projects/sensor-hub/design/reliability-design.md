# Reliability Design

## Device Reliability

- use watchdog timers on sensor nodes  
- ensure automatic reboot on failure  
- minimize firmware complexity  

---

## Communication Reliability

- implement retry logic for message transmission  
- use message broker to decouple communication  
- support temporary disconnection without system failure  

---

## Gateway Reliability

- use SSD for improved storage stability  
- ensure proper cooling to prevent overheating  
- maintain stable power supply  

---

## Service Reliability

- configure automatic container restart policies  
- monitor service health within Docker  
- isolate failures to individual services  

---

## Data Reliability

- validate incoming data before storage  
- prevent corrupted or malformed data  
- maintain consistent data schema  
