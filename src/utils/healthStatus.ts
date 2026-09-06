import { ThresholdsConfig, VitalStatus, AlertItem } from '../types';

export const DEFAULT_THRESHOLDS: ThresholdsConfig = {
  hrLowWarn: 40,        // Adjusted for resting heart rate & prototype PPG variance
  hrNormalMin: 50,      // Resting baseline min
  hrNormalMax: 100,
  hrWarnMax: 130,

  spo2NormalMin: 90,
  spo2WarnMin: 80,

  tempLowWarn: 20.0,    // Adjusted for prototype DS18B20 skin/ambient surface readings
  tempNormalMin: 25.0,  // Skin surface contact baseline
  tempNormalMax: 37.5,
  tempWarnMax: 38.5,

  deviceTimeoutSec: 15
};

export interface EvaluatedVital {
  status: VitalStatus;
  message?: string;
  isEmergency: boolean;
}

export function evaluateHeartRate(hr: number, config: ThresholdsConfig = DEFAULT_THRESHOLDS): EvaluatedVital {
  if (hr > config.hrWarnMax) {
    return { status: 'CRITICAL', message: `High Heart Rate: ${hr} BPM (Threshold >${config.hrWarnMax})`, isEmergency: true };
  }
  if (hr < config.hrLowWarn) {
    return { status: 'CRITICAL', message: `Low Heart Rate: ${hr} BPM (Threshold <${config.hrLowWarn})`, isEmergency: true };
  }
  if (hr > config.hrNormalMax && hr <= config.hrWarnMax) {
    return { status: 'WARNING', message: `Elevated Heart Rate: ${hr} BPM`, isEmergency: false };
  }
  if (hr >= config.hrLowWarn && hr < config.hrNormalMin) {
    return { status: 'WARNING', message: `Slightly Low Heart Rate: ${hr} BPM`, isEmergency: false };
  }
  return { status: 'STABLE', message: 'Heart Rate Normal', isEmergency: false };
}

export function evaluateSpO2(spo2: number, config: ThresholdsConfig = DEFAULT_THRESHOLDS): EvaluatedVital {
  if (spo2 < config.spo2WarnMin) {
    return { status: 'CRITICAL', message: `Critical Oxygen Saturation: ${spo2}% (Threshold <${config.spo2WarnMin}%)`, isEmergency: true };
  }
  if (spo2 >= config.spo2WarnMin && spo2 < config.spo2NormalMin) {
    return { status: 'WARNING', message: `Low Oxygen Saturation: ${spo2}% (Prototype Contact Warning)`, isEmergency: false };
  }
  return { status: 'STABLE', message: 'SpO2 Normal', isEmergency: false };
}

export function evaluateTemperature(temp: number, config: ThresholdsConfig = DEFAULT_THRESHOLDS): EvaluatedVital {
  if (temp > config.tempWarnMax) {
    return { status: 'CRITICAL', message: `High Fever: ${temp} °C (Threshold >${config.tempWarnMax} °C)`, isEmergency: true };
  }
  if (temp < config.tempLowWarn) {
    return { status: 'CRITICAL', message: `Sensor Out-of-Bounds: ${temp} °C (Threshold <${config.tempLowWarn} °C)`, isEmergency: true };
  }
  if (temp > config.tempNormalMax && temp <= config.tempWarnMax) {
    return { status: 'WARNING', message: `Elevated Temperature: ${temp} °C`, isEmergency: false };
  }
  return { status: 'STABLE', message: 'Temperature Normal (Prototype DS18B20 Surface Reading)', isEmergency: false };
}

export function evaluatePatientStatus(
  hr: number | null,
  spo2: number | null,
  temp: number | null,
  config: ThresholdsConfig = DEFAULT_THRESHOLDS
): { status: VitalStatus; emergency: boolean; alerts: Omit<AlertItem, 'id' | 'patientId' | 'patientName' | 'timestamp'>[] } {
  if (hr === null || spo2 === null || temp === null) {
    return { status: 'UNKNOWN', emergency: false, alerts: [] };
  }

  const hrEval = evaluateHeartRate(hr, config);
  const spo2Eval = evaluateSpO2(spo2, config);
  const tempEval = evaluateTemperature(temp, config);

  const alerts: Omit<AlertItem, 'id' | 'patientId' | 'patientName' | 'timestamp'>[] = [];

  if (hrEval.status === 'WARNING' || hrEval.status === 'CRITICAL') {
    alerts.push({
      vitalType: 'Heart Rate',
      severity: hrEval.status,
      value: `${hr} BPM`,
      message: hrEval.message || `Heart Rate ${hr} BPM`
    });
  }

  if (spo2Eval.status === 'WARNING' || spo2Eval.status === 'CRITICAL') {
    alerts.push({
      vitalType: 'SpO2',
      severity: spo2Eval.status,
      value: `${spo2}%`,
      message: spo2Eval.message || `SpO2 ${spo2}%`
    });
  }

  if (tempEval.status === 'WARNING' || tempEval.status === 'CRITICAL') {
    alerts.push({
      vitalType: 'Temperature',
      severity: tempEval.status,
      value: `${temp} °C`,
      message: tempEval.message || `Temperature ${temp} °C`
    });
  }

  const isEmergency = hrEval.isEmergency || spo2Eval.isEmergency || tempEval.isEmergency;

  let overallStatus: VitalStatus = 'STABLE';
  if (hrEval.status === 'CRITICAL' || spo2Eval.status === 'CRITICAL' || tempEval.status === 'CRITICAL') {
    overallStatus = 'CRITICAL';
  } else if (hrEval.status === 'WARNING' || spo2Eval.status === 'WARNING' || tempEval.status === 'WARNING') {
    overallStatus = 'WARNING';
  }

  return {
    status: overallStatus,
    emergency: isEmergency,
    alerts
  };
}
