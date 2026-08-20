import { VitalHistoryEntry, ThresholdsConfig, Patient } from '../types';
import { DEFAULT_THRESHOLDS } from './healthStatus';

export interface AIAnalysisResult {
  summary: string;
  recommendation: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  insights: string[];
  disclaimer: string;
  timestamp: string;
}

export function analyzePatientVitals(
  patient: Patient,
  history: VitalHistoryEntry[],
  config: ThresholdsConfig = DEFAULT_THRESHOLDS
): AIAnalysisResult {
  const patientHistory = history.filter(h => h.patientId === patient.patientId);
  const recent = patientHistory.slice(-10); // last 10 readings

  const insights: string[] = [];
  let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';

  if (!patient.heartRate || !patient.spo2 || !patient.temperature) {
    return {
      summary: 'Insufficient sensor data available to complete AI analysis.',
      recommendation: 'Ensure ESP32 sensor hardware is powered and transmitting vitals to the gateway.',
      riskLevel: 'LOW',
      insights: ['Waiting for active stream input...'],
      disclaimer: 'SOFTWARE RULE-BASED ANALYSIS — NOT A CERTIFIED MEDICAL DIAGNOSIS',
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // Analyze SpO2 trends
  if (patient.spo2 < config.spo2WarnMin) {
    riskLevel = 'CRITICAL';
    insights.push(`SpO2 level (${patient.spo2}%) has fallen below critical safety threshold (${config.spo2WarnMin}%). Hypoxia risk detected.`);
  } else if (patient.spo2 < config.spo2NormalMin) {
    if ((riskLevel as string) !== 'CRITICAL') riskLevel = 'HIGH';
    insights.push(`SpO2 level (${patient.spo2}%) is currently in warning range (${config.spo2WarnMin}% - ${config.spo2NormalMin - 1}%).`);
  } else {
    insights.push(`SpO2 levels (${patient.spo2}%) remain stable within normal baseline (≥${config.spo2NormalMin}%).`);
  }

  // SpO2 trend analysis over history
  if (recent.length >= 3) {
    const spo2Values = recent.map(r => r.spo2);
    const isDecreasing = spo2Values.every((val, idx) => idx === 0 || val <= spo2Values[idx - 1]);
    if (isDecreasing && spo2Values[0] > spo2Values[spo2Values.length - 1]) {
      insights.push(`Trend Alert: Oxygen saturation shows a downward trajectory across the last ${recent.length} samples.`);
    }
  }

  // Heart Rate analysis
  if (patient.heartRate > config.hrWarnMax) {
    if (riskLevel !== 'CRITICAL') riskLevel = 'HIGH';
    insights.push(`Severe Tachycardia detected: Heart rate is ${patient.heartRate} BPM (Threshold >${config.hrWarnMax}).`);
  } else if (patient.heartRate < config.hrLowWarn) {
    if (riskLevel !== 'CRITICAL') riskLevel = 'HIGH';
    insights.push(`Severe Bradycardia detected: Heart rate is ${patient.heartRate} BPM (Threshold <${config.hrLowWarn}).`);
  } else if (patient.heartRate > config.hrNormalMax) {
    if (riskLevel === 'LOW') riskLevel = 'MODERATE';
    insights.push(`Mild Tachycardia: Heart rate is elevated at ${patient.heartRate} BPM.`);
  } else {
    insights.push(`Heart rate (${patient.heartRate} BPM) is within normal resting range (${config.hrNormalMin} - ${config.hrNormalMax} BPM).`);
  }

  // Temperature analysis
  if (patient.temperature > config.tempWarnMax) {
    if (riskLevel !== 'CRITICAL') riskLevel = 'HIGH';
    insights.push(`High fever detected: Core temperature is ${patient.temperature} °C (Threshold >${config.tempWarnMax} °C).`);
  } else if (patient.temperature < config.tempLowWarn) {
    if (riskLevel !== 'CRITICAL') riskLevel = 'HIGH';
    insights.push(`Hypothermia alert: Core temperature is ${patient.temperature} °C (Threshold <${config.tempLowWarn} °C).`);
  } else if (patient.temperature > config.tempNormalMax) {
    if (riskLevel === 'LOW') riskLevel = 'MODERATE';
    insights.push(`Mild fever present: Core temperature is ${patient.temperature} °C.`);
  } else {
    insights.push(`Temperature (${patient.temperature} °C) is within normothermic range (${config.tempNormalMin} - ${config.tempNormalMax} °C).`);
  }

  // Combined risk summary & recommendations
  let summary = 'Patient vitals demonstrate stable physiological indicators.';
  let recommendation = 'Continue routine real-time monitoring.';

  if (riskLevel === 'CRITICAL') {
    summary = `CRITICAL ALERT: Multiple vital thresholds have exceeded physiological parameters. Immediate clinical review required for ${patient.patientName} (${patient.patientId}).`;
    recommendation = 'Contact attending medical staff immediately. Verify sensor placement and evaluate patient airway/oxygenation.';
  } else if (riskLevel === 'HIGH') {
    summary = `HIGH ALERT: Significant vital parameter deviation detected for patient ${patient.patientId}.`;
    recommendation = 'Perform physical check on patient in Room ' + patient.roomNumber + ' and re-validate telemetry.';
  } else if (riskLevel === 'MODERATE') {
    summary = `MODERATE RISK: Minor physiological variance observed in recent readings.`;
    recommendation = 'Increase monitoring frequency and observe trend patterns for 15 minutes.';
  }

  return {
    summary,
    recommendation,
    riskLevel,
    insights,
    disclaimer: 'SOFTWARE RULE-BASED ANALYSIS — NOT A CERTIFIED MEDICAL DIAGNOSIS',
    timestamp: new Date().toLocaleTimeString()
  };
}
