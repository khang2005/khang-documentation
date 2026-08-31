# Scalability

## Sensor Node Expansion

The system supports adding additional sensor nodes without major architectural changes.

- each node operates independently  
- new nodes can publish to the same message broker  
- no modification required for existing nodes  

---

## Service Scaling

Backend services can scale within the Docker environment.

- services can be replicated if needed  
- workloads can be distributed in future multi node setups  
- architecture supports horizontal scaling  

---

## Storage Scaling

- database can be expanded or migrated to external systems  
- data retention policies can manage long term storage  
- system can support increased data volume over time  

---

## Future Expansion

- additional gateways can be added to the system  
- system can transition from single node to distributed deployment  
- supports migration to cloud infrastructure  
