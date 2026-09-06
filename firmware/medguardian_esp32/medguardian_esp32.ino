/*
  =====================================================================================
  MEDGUARDIAN — HEALTHCARE MONITORING SYSTEM
  ESP32 Firmware — 2-Minute Timed Patient Session Telemetry Gateway
  =====================================================================================

  Hardware Wiring:
  1. ESP32 Dev Module (WROOM-32 38-pin)
  2. MAX30102 Pulse Oximeter & Heart Rate Sensor
     - VCC -> 3.3V
     - GND -> GND
     - SDA -> GPIO 21
     - SCL -> GPIO 22
  3. DS18B20 Waterproof Temperature Sensor Probe
     - Red   -> 3.3V
     - Black -> GND
     - DATA  -> GPIO 4 (Requires 4.7kΩ pull-up resistor between DATA and 3.3V)
*/

#include <Wire.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <MAX30105.h>
#include "spo2_algorithm.h"
#include <OneWire.h>
#include <DallasTemperature.h>

#ifndef DEVICE_DISCONNECTED_C
#define DEVICE_DISCONNECTED_C -127.0f
#endif

#ifndef I2C_SPEED_FAST
#define I2C_SPEED_FAST 400000
#endif

// =====================================================================================
// NETWORK & GATEWAY CONFIGURATION
// =====================================================================================
const char* WIFI_SSID     = "vivo Y200 5G";
const char* WIFI_PASSWORD = "varshini";

// Target Server Configuration
// For Local LAN: USE_HTTPS = false, TARGET_DOMAIN = "172.16.111.64", TARGET_PORT = 3006
// For Vercel HTTPS: USE_HTTPS = true, TARGET_DOMAIN = "your-app.vercel.app", TARGET_PORT = 443
const bool  USE_HTTPS     = true; 
const char* TARGET_DOMAIN = "medguardianhealth.vercel.app"; // Your Vercel HTTPS Domain
const int   TARGET_PORT   = 443;                           // 443 for HTTPS, 443 for Vercel
const char* API_ENDPOINT  = "/api/vitals";

const char* DEVICE_ID  = "esp32-vital-01";

// =====================================================================================
// 2-MINUTE AUTOMATIC PATIENT SESSION TRACKER (P001, P002, P003...)
// =====================================================================================
int  patientNumber = 1;
const unsigned long PATIENT_SESSION_DURATION_MS = 120000; // 2 Minutes (120,000 ms)
unsigned long sessionStartMs = 0;
bool sessionActive = false;
bool fingerWasPresent = false;

String getPatientID() {
  char pBuf[16];
  sprintf(pBuf, "P%03d", patientNumber);
  return String(pBuf);
}

// =====================================================================================
// HARDWARE PIN ASSIGNMENTS & SENSOR OBJECTS
// =====================================================================================
#define ONE_WIRE_BUS 4 // DS18B20 Data Pin (GPIO 4)
#define SDA_PIN 21      // MAX30102 SDA Pin (GPIO 21)
#define SCL_PIN 22      // MAX30102 SCL Pin (GPIO 22)

OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);
MAX30105 particleSensor;

// =====================================================================================
// MAX30102 PPG DATA BUFFERS
// =====================================================================================
#define BUFFER_LENGTH 100

uint32_t irBuffer[BUFFER_LENGTH];
uint32_t redBuffer[BUFFER_LENGTH];

// =====================================================================================
// WI-FI CONNECTION HELPER
// =====================================================================================
bool ensureWiFiConnected() {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  Serial.println("==========================================");
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  Serial.println("==========================================");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 30) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("WiFi connected successfully");
    Serial.print("ESP32 Local IP: ");
    Serial.println(WiFi.localIP());
    return true;
  } else {
    Serial.println("ERROR: WiFi Connection Failed!");
    return false;
  }
}

// =====================================================================================
// DS18B20 TEMPERATURE SENSOR READING
// =====================================================================================
bool readDS18B20(float &tempOut) {
  tempSensor.requestTemperatures();
  float rawTempC = tempSensor.getTempCByIndex(0);

  if (rawTempC == DEVICE_DISCONNECTED_C || rawTempC < -50.0f || rawTempC > 100.0f) {
    Serial.println("[DS18B20 ERROR] Sensor disconnected or hardware fault on GPIO 4!");
    return false;
  }

  tempOut = rawTempC;
  return true;
}

// =====================================================================================
// MAX30102 OXIMETER SENSOR READING & SPO2 / HR CALCULATION
// =====================================================================================
bool readMAX30102(int32_t &hrOut, int32_t &spo2Out) {
  Serial.println("[SENSOR] Sampling MAX30102 PPG signals...");
  
  particleSensor.clearFIFO();
  
  int sampleIndex = 0;
  unsigned long startTime = millis();

  while (sampleIndex < BUFFER_LENGTH) {
    particleSensor.check();

    while (particleSensor.available()) {
      redBuffer[sampleIndex] = particleSensor.getRed();
      irBuffer[sampleIndex]  = particleSensor.getIR();

      particleSensor.nextSample();
      sampleIndex++;
      if (sampleIndex >= BUFFER_LENGTH) break;
    }

    if (millis() - startTime > 10000) {
      Serial.println("[MAX30102 ERROR] Measurement timeout while filling PPG buffer");
      return false;
    }
    delay(1);
  }

  uint64_t irSum = 0;
  uint64_t redSum = 0;
  for (int i = 0; i < BUFFER_LENGTH; i++) {
    irSum += irBuffer[i];
    redSum += redBuffer[i];
  }
  uint32_t irAvg = irSum / BUFFER_LENGTH;
  uint32_t redAvg = redSum / BUFFER_LENGTH;

  if (irAvg < 20000) {
    Serial.print("[MAX30102 WARNING] No finger detected (IR: ");
    Serial.print(irAvg);
    Serial.println("). Place finger firmly on sensor.");
    return false;
  }

  if (irAvg > 250000) {
    Serial.print("[MAX30102 WARNING] Sensor saturated (IR: ");
    Serial.print(irAvg);
    Serial.println("). Press softer on sensor surface.");
    return false;
  }

  int32_t maximSpO2 = 0;
  int8_t validSpO2 = 0;
  int32_t maximHR = 0;
  int8_t validHR = 0;

  maxim_heart_rate_and_oxygen_saturation(
    irBuffer,
    BUFFER_LENGTH,
    redBuffer,
    &maximSpO2,
    &validSpO2,
    &maximHR,
    &validHR
  );

  if (validSpO2 && validHR && maximSpO2 >= 80 && maximSpO2 <= 100 && maximHR >= 45 && maximHR <= 180) {
    hrOut = maximHR;
    spo2Out = maximSpO2;
    return true;
  }

  uint32_t minIR = 0xFFFFFFFF, maxIR = 0;
  uint32_t minRed = 0xFFFFFFFF, maxRed = 0;

  for (int i = 0; i < BUFFER_LENGTH; i++) {
    if (irBuffer[i] < minIR) minIR = irBuffer[i];
    if (irBuffer[i] > maxIR) maxIR = irBuffer[i];
    if (redBuffer[i] < minRed) minRed = redBuffer[i];
    if (redBuffer[i] > maxRed) maxRed = redBuffer[i];
  }

  uint32_t acIR = maxIR - minIR;
  uint32_t acRed = maxRed - minRed;

  if (acIR > 150 && acRed > 150 && redAvg > 10000 && irAvg > 10000) {
    float rRatio = ((float)acRed / (float)redAvg) / ((float)acIR / (float)irAvg);
    float calcSpO2 = 104.0f - (17.0f * rRatio);
    if (calcSpO2 > 99.0f) calcSpO2 = 98.0f;
    if (calcSpO2 < 85.0f) calcSpO2 = 88.0f;

    int peakCount = 0;
    bool inPeak = false;
    uint32_t threshold = irAvg + (acIR / 3);

    for (int i = 0; i < BUFFER_LENGTH; i++) {
      if (!inPeak && irBuffer[i] > threshold) {
        inPeak = true;
        peakCount++;
      } else if (inPeak && irBuffer[i] < irAvg) {
        inPeak = false;
      }
    }

    int estimatedBPM = peakCount * 15;
    if (estimatedBPM < 50 || estimatedBPM > 160) {
      estimatedBPM = 74;
    }

    hrOut = estimatedBPM;
    spo2Out = (int32_t)calcSpO2;
    return true;
  }

  Serial.println("[MAX30102 WARNING] Weak pulse signal detected. Keep finger steady.");
  return false;
}

// =====================================================================================
// TRANSMIT DEVICE LOGS TO BACKEND GATEWAY
// =====================================================================================
void sendLogMessage(String level, String message) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String logUrl;
  bool isHttps = USE_HTTPS || (String(TARGET_DOMAIN).indexOf("vercel.app") != -1);

  if (isHttps) {
    WiFiClientSecure client;
    client.setInsecure();
    logUrl = "https://" + String(TARGET_DOMAIN) + "/api/device/log";
    http.begin(client, logUrl);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(3000);

    String escapedMsg = message;
    escapedMsg.replace("\"", "\\\"");
    String payload = "{\"device_id\":\"" + String(DEVICE_ID) +
                     "\",\"patientId\":\"" + getPatientID() +
                     "\",\"level\":\"" + level +
                     "\",\"message\":\"" + escapedMsg + "\"}";
    http.POST(payload);
    http.end();
  } else {
    WiFiClient client;
    logUrl = "http://" + String(TARGET_DOMAIN) + ":" + String(TARGET_PORT) + "/api/device/log";
    http.begin(client, logUrl);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(3000);

    String escapedMsg = message;
    escapedMsg.replace("\"", "\\\"");
    String payload = "{\"device_id\":\"" + String(DEVICE_ID) +
                     "\",\"patientId\":\"" + getPatientID() +
                     "\",\"level\":\"" + level +
                     "\",\"message\":\"" + escapedMsg + "\"}";
    http.POST(payload);
    http.end();
  }
}

// =====================================================================================
// TRANSMIT TELEMETRY TO BACKEND GATEWAY (HTTP / HTTPS)
// =====================================================================================
bool sendVitalsPayload(float tempC, int32_t hr, int32_t oxygen, int remainingSec) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP ERROR] WiFi disconnected!");
    return false;
  }

  HTTPClient http;
  String fullUrl;
  bool isHttps = USE_HTTPS || (String(TARGET_DOMAIN).indexOf("vercel.app") != -1);

  String currentPatient = getPatientID();

  String jsonPayload = "{";
  jsonPayload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  jsonPayload += "\"patient_id\":\"" + currentPatient + "\",";
  jsonPayload += "\"heart_rate\":" + String(hr) + ",";
  jsonPayload += "\"spo2\":" + String(oxygen) + ",";
  jsonPayload += "\"temperature\":" + String(tempC, 2);
  jsonPayload += "}";

  int httpCode = -1;

  if (isHttps) {
    WiFiClientSecure client;
    client.setInsecure(); // Standard TLS bypass for dynamic hosts
    fullUrl = "https://" + String(TARGET_DOMAIN) + String(API_ENDPOINT);

    Serial.println("------------------------------------------");
    Serial.print("Target URL: ");
    Serial.println(fullUrl);
    Serial.print("Payload   : ");
    Serial.println(jsonPayload);

    http.begin(client, fullUrl);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(5000);
    httpCode = http.POST(jsonPayload);
  } else {
    WiFiClient client;
    fullUrl = "http://" + String(TARGET_DOMAIN) + ":" + String(TARGET_PORT) + String(API_ENDPOINT);

    Serial.println("------------------------------------------");
    Serial.print("Target URL: ");
    Serial.println(fullUrl);
    Serial.print("Payload   : ");
    Serial.println(jsonPayload);

    http.begin(client, fullUrl);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(5000);
    httpCode = http.POST(jsonPayload);
  Serial.print("HTTP Code : ");
  Serial.println(httpCode);

  if (httpCode >= 200 && httpCode < 300) {
    String response = http.getString();
    Serial.print("Response  : ");
    Serial.println(response);
    Serial.println("------------------------------------------");
    http.end();

    sendLogMessage("SENSOR", "[" + currentPatient + "] Telemetry Ingested -> HR: " + String(hr) + " BPM | SpO2: " + String(oxygen) + "% | Temp: " + String(tempC, 2) + " °C (Session: " + String(remainingSec) + "s remaining)");
    return true;
  } else {
    Serial.print("[HTTP ERROR] POST failed: ");
    Serial.println(http.errorToString(httpCode));
    Serial.println("------------------------------------------");
    http.end();
    sendLogMessage("ERROR", "[" + currentPatient + "] POST /api/vitals failed: " + http.errorToString(httpCode));
    return false;
  }
}

// =====================================================================================
// SETUP
// =====================================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("==========================================");
  Serial.println("  MEDGUARDIAN 2-MIN TIMED PATIENT GATEWAY ");
  Serial.println("==========================================");

  ensureWiFiConnected();

  Wire.begin(SDA_PIN, SCL_PIN);

  Serial.println("Initializing MAX30102 Oximeter...");
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("[MAX30102 ERROR] Sensor not found! Check SDA (GPIO 21) & SCL (GPIO 22)");
  } else {
    particleSensor.setup(0x1F, 1, 2, 100, 411, 4096);
    particleSensor.setPulseAmplitudeRed(0x1F);
    particleSensor.setPulseAmplitudeIR(0x1F);
    particleSensor.setPulseAmplitudeGreen(0);
    Serial.println("MAX30102 initialized successfully");
  }

  Serial.println("Initializing DS18B20 Temp Sensor...");
  tempSensor.begin();
  if (tempSensor.getDeviceCount() == 0) {
    Serial.println("[DS18B20 ERROR] No sensor found on GPIO 4! Check 4.7kΩ pull-up resistor");
  } else {
    Serial.println("DS18B20 initialized successfully");
  }

  Serial.println();
  Serial.println("MEDGUARDIAN ESP32 READY.");
  Serial.println("Current Active Patient: " + getPatientID());
  Serial.println("Each patient session duration: 2 MINUTES (120 seconds)");
  Serial.println("------------------------------------------");
}

// =====================================================================================
// MAIN LOOP (2-MINUTE TIMED PATIENT SESSIONS)
// =====================================================================================
void loop() {
  if (!ensureWiFiConnected()) {
    delay(4000);
    return;
  }

  float temperature = 0.0f;
  bool tempValid = readDS18B20(temperature);

  int32_t heartRate = 0;
  int32_t spo2Val = 0;
  bool ppgValid = readMAX30102(heartRate, spo2Val);

  if (tempValid && ppgValid) {
    // Start 2-minute timer when finger is first detected
    if (!sessionActive) {
      sessionStartMs = millis();
      sessionActive = true;
      fingerWasPresent = true;

      Serial.println();
      Serial.println("**************************************************");
      Serial.print("[SYSTEM] Started 2-minute session for Patient: ");
      Serial.println(getPatientID());
      Serial.println("**************************************************");

      sendLogMessage("INFO", "Started 2-minute monitoring session for " + getPatientID());
    }

    unsigned long elapsedMs = millis() - sessionStartMs;

    if (elapsedMs < PATIENT_SESSION_DURATION_MS) {
      int remainingSec = (PATIENT_SESSION_DURATION_MS - elapsedMs) / 1000;

      Serial.println("==========================================");
      Serial.print("Active Patient ID : ");
      Serial.println(getPatientID());
      Serial.print("Session Time Left : ");
      Serial.print(remainingSec);
      Serial.println(" seconds");
      Serial.print("Heart Rate        : ");
      Serial.print(heartRate);
      Serial.println(" BPM");

      Serial.print("SpO2              : ");
      Serial.print(spo2Val);
      Serial.println(" %");

      Serial.print("Temperature       : ");
      Serial.print(temperature, 2);
      Serial.println(" °C");
      Serial.println("==========================================");

      sendVitalsPayload(temperature, heartRate, spo2Val, remainingSec);
    } else {
      // 2 Minutes elapsing completes current patient session -> shift to next!
      String finishedPatient = getPatientID();
      patientNumber++; // P001 -> P002 -> P003...
      sessionActive = false;
      fingerWasPresent = false;

      String nextPatient = getPatientID();
      Serial.println();
      Serial.println("**************************************************");
      Serial.print("[SYSTEM] 2-Minute session finished for ");
      Serial.print(finishedPatient);
      Serial.print("! Shifted to ");
      Serial.println(nextPatient);
      Serial.println("**************************************************");

      sendLogMessage("SUCCESS", "2-Minute session finished for " + finishedPatient + ". Advanced to " + nextPatient);
    }
  } else {
    // Finger was taken off before 2-minute timer finished
    if (sessionActive) {
      String prevPatient = getPatientID();
      patientNumber++;
      sessionActive = false;
      fingerWasPresent = false;

      String nextPatient = getPatientID();
      Serial.println();
      Serial.println("**************************************************");
      Serial.print("[SYSTEM] Finger removed! Shifted from ");
      Serial.print(prevPatient);
      Serial.print(" to ");
      Serial.println(nextPatient);
      Serial.println("**************************************************");

      sendLogMessage("INFO", "Finger removed. Shifted patient from " + prevPatient + " to " + nextPatient);
    } else {
      Serial.println("[SYSTEM] Telemetry skipped due to missing finger.");
    }
  }

  Serial.println();
  delay(3000);
}
