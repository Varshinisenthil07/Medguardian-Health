# MEDGUARDIAN — Real-Time Healthcare Monitoring System

MedGuardian is a complete working IoT healthcare monitoring web application designed to ingest and display real-time patient physiological vitals (**Heart Rate**, **SpO2**, **Body Temperature**) transmitted over Wi-Fi from an **ESP32 micro-controller** equipped with MAX30102 pulse oximeter and DS18B20 temperature sensors.

---

## 1. System Architecture Diagram

```
+-------------------------------------------------------------------+
|                         ESP32 DEV MODULE                          |
|                                                                   |
|   MAX30102 Oximeter        DS18B20 Temp Probe                     |
|   (I2C SDA=21, SCL=22)     (OneWire GPIO 4 + 4.7k Pull-up)        |
+---------------------------------+---------------------------------+
                                  |
                           Wi-Fi Telemetry
                                  |
                                  v
+-------------------------------------------------------------------+
|               EXPRESS BACKEND GATEWAY (Port 3006)                 |
|                                                                   |
|   - Host: 0.0.0.0 (Accessible via LAN IP)                         |
|   - In-Memory Patient State & Telemetry History Store             |
|   - Ingress Endpoint: POST /api/vitals                            |
|   - Event Broadcaster: Server-Sent Events (SSE) /api/events       |
+---------------------------------+---------------------------------+
                                  |
                          SSE Event Stream
                                  |
                                  v
+-------------------------------------------------------------------+
|                    REACT DASHBOARD FRONTEND                       |
|                                                                   |
|   - Single Port 3006 Server Integration                           |
|   - Real Hardware Mode vs. Simulation Mode Isolation             |
|   - Dynamic Recharts Live Waveform Graphs                         |
|   - Configurable Safety Thresholds & Emergency Alarms             |
+-------------------------------------------------------------------+
```

---

## 2. Hardware Components & Wiring Diagram

### Hardware Required
1. **ESP32 Dev Module** (WROOM-32)
2. **MAX30102** Heart Rate & Pulse Oximeter Sensor
3. **DS18B20** Waterproof Temperature Sensor Probe
4. **4.7k Ohm Pull-up Resistor** (between DS18B20 DATA and VCC)
5. Breadboard and Jumper Wires

### Pin Assignment Table

| Component | Pin / Terminal | ESP32 GPIO Pin | Notes |
| :--- | :--- | :--- | :--- |
| **MAX30102** | VCC | 3.3V | Power Supply |
| **MAX30102** | GND | GND | Ground |
| **MAX30102** | SDA | **GPIO 21** | I2C Data Line |
| **MAX30102** | SCL | **GPIO 22** | I2C Clock Line |
| **DS18B20** | VCC | 3.3V / 5V | Power |
| **DS18B20** | GND | GND | Ground |
| **DS18B20** | DATA | **GPIO 4** | OneWire Bus Data (*Requires 4.7k pullup to VCC*) |

---

## 3. Software Requirements & Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **Arduino IDE** (for flashing ESP32 firmware)
  - Required Arduino Libraries:
    - `SparkFun MAX3010x Pulse and Proximity Sensor Library`
    - `OneWire`
    - `DallasTemperature`

---

## 4. Quick Start: Installation & Server Launch

### Step 1: Install Dependencies
Open terminal in the project directory and run:
```bash
npm install
```

### Step 2: Start Unified Server
Launch the combined Express Backend + Vite React Frontend on port `3006`:
```bash
npm run dev
```

The server will output:
```text
=====================================================
  MEDGUARDIAN IoT GATEWAY SERVER STARTED
=====================================================
  Local URL:   http://localhost:3006
  Network URL: http://0.0.0.0:3006
```

---

## 5. Finding Your Laptop LAN IP Address

To allow ESP32 devices on your Wi-Fi network to transmit telemetry data, obtain your laptop's Wi-Fi IPv4 address.

### Windows Command Prompt / PowerShell:
```cmd
ipconfig
```
Look for **Wireless LAN adapter Wi-Fi** -> **IPv4 Address** (e.g. `172.16.109.94`).

---

## 6. ESP32 Firmware Configuration & Flashing

1. Open `firmware/medguardian_esp32/medguardian_esp32.ino` in Arduino IDE.
2. Update Wi-Fi Credentials and `SERVER_URL`:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_Network_Name";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";

   // Replace 172.16.109.94 with your actual laptop LAN IP
   const char* SERVER_URL    = "http://172.16.109.94:3006/api/vitals";
   ```
3. Select Board: **ESP32 Dev Module**.
4. Upload code to ESP32.
5. Open Serial Monitor at **115200 baud** to view transmission logs:
   ```text
   ==========================================
   COLLECTING PATIENT DATA
   ==========================================
   Temperature : 36.70 °C
   Heart Rate  : 78 BPM
   SpO2        : 97 %
   ==========================================
   SENDING DATA TO DASHBOARD
   ==========================================
   JSON:
   {"patientId":"P001","heartRate":78,"spo2":97,"temperature":36.70}
   POST URL:
   http://172.16.109.94:3006/api/vitals
   HTTP Response Code:
   200
   DATA SENT SUCCESSFULLY!
   ```

---

## 7. Backend API Specification

All endpoints respond with `application/json` format and run on port `3006`.

### `GET /api/health`
Health check gateway endpoint.
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "service": "MedGuardian IoT Gateway"
  }
  ```

### `GET /api/vitals`
Retrieve current latest vital state for all monitored patients.
- **Response (200 OK):**
  ```json
  [
    {
      "patientId": "P001",
      "patientName": "Patient 001",
      "heartRate": 93,
      "spo2": 86,
      "temperature": 35.69,
      "emergency": false,
      "status": "STABLE",
      "deviceStatus": "ONLINE",
      "timestamp": "10:32:15 AM",
      "lastSeen": "2026-08-18T10:32:15.000Z"
    }
  ]
  ```

### `POST /api/vitals`
Ingest new sensor telemetry payload from ESP32.
- **Request Body:**
  ```json
  {
    "patientId": "P001",
    "heartRate": 93,
    "spo2": 86,
    "temperature": 35.69
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "ESP32 vitals ingested successfully",
    "patientId": "P001",
    "vitals": {
      "heartRate": 93,
      "spo2": 86,
      "temperature": 35.69
    }
  }
  ```

### `GET /api/events` (Server-Sent Events)
Stream endpoint providing zero-latency push updates to connected React dashboards.

---

## 8. Command Line Testing (Curl)

You can test the API directly using curl commands in terminal:

### Test Ingest POST Request:
```bash
curl -X POST http://localhost:3006/api/vitals \
  -H "Content-Type: application/json" \
  -d "{\"patientId\":\"P001\",\"heartRate\":93,\"spo2\":86,\"temperature\":35.69}"
```

---

## 9. Hardware Mode vs. Simulation Mode

- **ESP32 REAL HARDWARE MODE**: Displays real telemetry received via HTTP POST from physical sensors. Displays **"WAITING FOR ESP32 DATA"** until first hardware packet arrives. Simulated values are strictly prevented from overwriting real hardware state.
- **SIMULATION MODE**: Isolated testing sandbox for UI demonstrations. Supports Normal, Warning, and Emergency test scenarios.

---

## 10. Disclaimer

> **IMPORTANT**: MedGuardian is an IoT demonstration software system created for academic and research purposes. It is **NOT** a certified medical device and must **NOT** be used for clinical diagnosis, critical care, or life support.
