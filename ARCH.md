### Architecture Overview

This project tracks vehicles (like ships, planes, and trucks) on a map in real-time.

![image](https://github.com/user-attachments/assets/075fabbb-9296-4dce-82b9-47e532598ab6)

Here’s a breakdown of each part of the system:

1. **Vehicles**: These are the ships, planes, and trucks that send location data to our system.

2. **SignalGateway (NodeJS)**: A service that receives real-time data from the vehicles and sends it to Redis.

3. **REDIS**: A message broker that temporarily stores vehicle data and sends it to the web application.

4. **WebApp**:
   - **Laravel**: The backend framework that manages data, APIs, and handles requests.
   - **MapLibre**: A tool to display vehicle locations on a map.
   - **VueJS**: The front-end framework that updates the user interface in real-time.

5. **Database (PostgreSQL)**: Stores all the historical and real-time data about the vehicles' locations.

6. **Vector Tiles Server (Martin)**: Provides map tiles to display on the map, making it load faster and use less data.

7. **Reverse Proxy (NGINX)**: Manages requests between users and the web application, also helps with security and load balancing.

8. **Internet**: Connects the web application to the users.

9. **Client**: The user’s device (like a computer or phone) where they view and interact with the real-time map.

This setup lets users track vehicles in real-time on a map, with data processed quickly and efficiently.
