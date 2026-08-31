# Message Format

## Example Payload

```json
{
  "sensor_id": "node_1",
  "timestamp": 1714210000,
  "type": "temperature",
  "value": 24.6,
  "unit": "C",
  "battery": 87
}
```

---

## Field Definitions

**sensor_id**  
unique identifier for each sensor node  

**timestamp**  
time of measurement in epoch format  

**type**  
type of sensor reading such as temperature or humidity  

**value**  
measured value  

**unit**  
unit of measurement  

**battery**  
optional battery percentage of the sensor node  

---

## Design Principles

- lightweight structure for efficient transmission  
- consistent schema across all sensor nodes  
- easy to extend with additional fields  
- human readable for debugging and testing  
