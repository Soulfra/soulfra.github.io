// HealthMonitor.js - Wellness tracking for seniors

const EventEmitter = require('events');
const crypto = require('crypto');

class HealthMonitor extends EventEmitter {
  constructor() {
    super();
    this.profiles = new Map();
    this.vitalRecords = new Map();
    this.medications = new Map();
    this.symptoms = new Map();
    this.appointments = new Map();
    this.emergencyProtocols = new Map();
    this.wellnessPlans = new Map();
    this.initializeHealthMetrics();
  }

  // Health Profile Management
  createHealthProfile(userId, medicalInfo) {
    const profileId = `health_${crypto.randomBytes(8).toString('hex')}`;
    const profile = {
      id: profileId,
      userId,
      created: new Date().toISOString(),
      basicInfo: {
        age: medicalInfo.age,
        gender: medicalInfo.gender,
        height: medicalInfo.height,
        weight: medicalInfo.weight,
        bloodType: medicalInfo.bloodType
      },
      conditions: medicalInfo.conditions || [],
      allergies: medicalInfo.allergies || [],
      surgeries: medicalInfo.surgeries || [],
      familyHistory: medicalInfo.familyHistory || {},
      primaryPhysician: medicalInfo.primaryPhysician || null,
      specialists: medicalInfo.specialists || [],
      emergencyContacts: medicalInfo.emergencyContacts || [],
      insurance: {
        provider: medicalInfo.insuranceProvider,
        policyNumber: medicalInfo.policyNumber,
        groupNumber: medicalInfo.groupNumber
      },
      preferences: {
        hospitalPreference: medicalInfo.hospitalPreference,
        doNotResuscitate: medicalInfo.dnr || false,
        organDonor: medicalInfo.organDonor || false
      },
      baselineVitals: this.establishBaseline(medicalInfo),
      riskFactors: this.assessRiskFactors(medicalInfo),
      monitoringPriorities: this.determineMonitoringPriorities(medicalInfo)
    };

    this.profiles.set(profileId, profile);
    this.setupMonitoringProtocols(profileId, profile);
    this.emit('profileCreated', profile);
    
    return profile;
  }

  establishBaseline(medicalInfo) {
    return {
      bloodPressure: {
        systolic: medicalInfo.baselineSystolic || 120,
        diastolic: medicalInfo.baselineDiastolic || 80,
        category: this.categorizeBP(medicalInfo.baselineSystolic || 120, medicalInfo.baselineDiastolic || 80)
      },
      heartRate: {
        resting: medicalInfo.restingHeartRate || 70,
        category: this.categorizeHR(medicalInfo.restingHeartRate || 70)
      },
      bloodSugar: {
        fasting: medicalInfo.fastingGlucose || 95,
        category: this.categorizeGlucose(medicalInfo.fastingGlucose || 95)
      },
      weight: {
        current: medicalInfo.weight,
        bmi: this.calculateBMI(medicalInfo.weight, medicalInfo.height),
        category: this.categorizeBMI(this.calculateBMI(medicalInfo.weight, medicalInfo.height))
      },
      oxygenSaturation: {
        normal: medicalInfo.oxygenLevel || 98,
        category: 'normal'
      }
    };
  }

  assessRiskFactors(medicalInfo) {
    const risks = [];
    
    // Age-related risks
    if (medicalInfo.age >= 65) {
      risks.push({ factor: 'age', level: 'moderate', description: 'Age 65+' });
    }
    if (medicalInfo.age >= 80) {
      risks.push({ factor: 'advanced_age', level: 'high', description: 'Age 80+' });
    }
    
    // Condition-based risks
    const highRiskConditions = ['diabetes', 'heart disease', 'hypertension', 'copd', 'kidney disease'];
    medicalInfo.conditions?.forEach(condition => {
      if (highRiskConditions.includes(condition.toLowerCase())) {
        risks.push({ 
          factor: condition, 
          level: 'high', 
          description: `Diagnosed with ${condition}` 
        });
      }
    });
    
    // BMI risks
    const bmi = this.calculateBMI(medicalInfo.weight, medicalInfo.height);
    if (bmi > 30) {
      risks.push({ factor: 'obesity', level: 'moderate', description: 'BMI over 30' });
    }
    
    // Lifestyle risks
    if (medicalInfo.smoker) {
      risks.push({ factor: 'smoking', level: 'high', description: 'Current smoker' });
    }
    
    return risks;
  }

  determineMonitoringPriorities(medicalInfo) {
    const priorities = [];
    
    // Condition-specific monitoring
    if (medicalInfo.conditions?.includes('diabetes')) {
      priorities.push({
        metric: 'blood_sugar',
        frequency: 'daily',
        times: ['morning', 'before_meals', 'bedtime']
      });
    }
    
    if (medicalInfo.conditions?.includes('hypertension') || medicalInfo.conditions?.includes('heart disease')) {
      priorities.push({
        metric: 'blood_pressure',
        frequency: 'twice_daily',
        times: ['morning', 'evening']
      });
    }
    
    // Default monitoring for all seniors
    priorities.push(
      {
        metric: 'weight',
        frequency: 'weekly',
        times: ['morning']
      },
      {
        metric: 'general_wellness',
        frequency: 'daily',
        times: ['morning']
      }
    );
    
    return priorities;
  }

  // Vital Signs Recording
  recordVitals(userId, vitals) {
    const record = {
      id: `vitals_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      timestamp: new Date(),
      measurements: {},
      alerts: [],
      notes: vitals.notes || ''
    };

    // Blood Pressure
    if (vitals.bloodPressure) {
      const [systolic, diastolic] = vitals.bloodPressure.split('/');
      record.measurements.bloodPressure = {
        systolic: parseInt(systolic),
        diastolic: parseInt(diastolic),
        category: this.categorizeBP(parseInt(systolic), parseInt(diastolic)),
        position: vitals.bpPosition || 'sitting',
        arm: vitals.bpArm || 'left'
      };
      
      const bpAlert = this.checkBPAlert(parseInt(systolic), parseInt(diastolic));
      if (bpAlert) record.alerts.push(bpAlert);
    }

    // Heart Rate
    if (vitals.heartRate) {
      record.measurements.heartRate = {
        value: vitals.heartRate,
        rhythm: vitals.rhythm || 'regular',
        category: this.categorizeHR(vitals.heartRate)
      };
      
      const hrAlert = this.checkHRAlert(vitals.heartRate);
      if (hrAlert) record.alerts.push(hrAlert);
    }

    // Blood Sugar
    if (vitals.bloodSugar) {
      record.measurements.bloodSugar = {
        value: vitals.bloodSugar,
        type: vitals.glucoseType || 'random', // fasting, postprandial, random
        lastMeal: vitals.lastMeal || 'unknown',
        category: this.categorizeGlucose(vitals.bloodSugar, vitals.glucoseType)
      };
      
      const glucoseAlert = this.checkGlucoseAlert(vitals.bloodSugar, vitals.glucoseType);
      if (glucoseAlert) record.alerts.push(glucoseAlert);
    }

    // Temperature
    if (vitals.temperature) {
      record.measurements.temperature = {
        value: vitals.temperature,
        unit: vitals.tempUnit || 'F',
        method: vitals.tempMethod || 'oral',
        category: this.categorizeTemp(vitals.temperature, vitals.tempUnit)
      };
      
      const tempAlert = this.checkTempAlert(vitals.temperature, vitals.tempUnit);
      if (tempAlert) record.alerts.push(tempAlert);
    }

    // Oxygen Saturation
    if (vitals.oxygenLevel) {
      record.measurements.oxygenSaturation = {
        value: vitals.oxygenLevel,
        onOxygen: vitals.onOxygen || false,
        category: this.categorizeO2(vitals.oxygenLevel)
      };
      
      const o2Alert = this.checkO2Alert(vitals.oxygenLevel);
      if (o2Alert) record.alerts.push(o2Alert);
    }

    // Weight
    if (vitals.weight) {
      record.measurements.weight = {
        value: vitals.weight,
        unit: vitals.weightUnit || 'lbs',
        clothed: vitals.clothed !== false
      };
      
      // Check for significant weight changes
      const weightAlert = this.checkWeightChange(userId, vitals.weight);
      if (weightAlert) record.alerts.push(weightAlert);
    }

    // Store record
    const userRecords = this.vitalRecords.get(userId) || [];
    userRecords.push(record);
    this.vitalRecords.set(userId, userRecords);

    // Process alerts
    if (record.alerts.length > 0) {
      this.processHealthAlerts(userId, record.alerts);
    }

    // Update wellness score
    this.updateWellnessScore(userId, record);

    this.emit('vitalsRecorded', record);
    return record;
  }

  // Categorization Methods
  categorizeBP(systolic, diastolic) {
    if (systolic < 120 && diastolic < 80) return 'normal';
    if (systolic < 130 && diastolic < 80) return 'elevated';
    if (systolic < 140 || diastolic < 90) return 'stage_1_hypertension';
    if (systolic >= 140 || diastolic >= 90) return 'stage_2_hypertension';
    if (systolic > 180 || diastolic > 120) return 'hypertensive_crisis';
    return 'unknown';
  }

  categorizeHR(rate) {
    if (rate < 50) return 'bradycardia';
    if (rate >= 50 && rate <= 100) return 'normal';
    if (rate > 100 && rate <= 150) return 'tachycardia';
    if (rate > 150) return 'severe_tachycardia';
    return 'unknown';
  }

  categorizeGlucose(value, type = 'random') {
    if (type === 'fasting') {
      if (value < 70) return 'hypoglycemia';
      if (value < 100) return 'normal';
      if (value < 126) return 'prediabetes';
      return 'diabetes';
    } else if (type === 'postprandial') {
      if (value < 70) return 'hypoglycemia';
      if (value < 140) return 'normal';
      if (value < 200) return 'impaired';
      return 'diabetes';
    } else { // random
      if (value < 70) return 'hypoglycemia';
      if (value < 200) return 'normal_to_elevated';
      return 'high';
    }
  }

  categorizeTemp(temp, unit = 'F') {
    const fahrenheit = unit === 'C' ? (temp * 9/5) + 32 : temp;
    if (fahrenheit < 96) return 'hypothermia';
    if (fahrenheit < 97.5) return 'low';
    if (fahrenheit <= 99.5) return 'normal';
    if (fahrenheit <= 100.4) return 'elevated';
    if (fahrenheit <= 103) return 'fever';
    return 'high_fever';
  }

  categorizeO2(level) {
    if (level >= 95) return 'normal';
    if (level >= 90) return 'mild_hypoxemia';
    if (level >= 85) return 'moderate_hypoxemia';
    return 'severe_hypoxemia';
  }

  calculateBMI(weight, height) {
    // Assuming weight in lbs and height in inches
    return (weight / (height * height)) * 703;
  }

  categorizeBMI(bmi) {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    if (bmi < 35) return 'obese_1';
    if (bmi < 40) return 'obese_2';
    return 'obese_3';
  }

  // Alert Checking Methods
  checkBPAlert(systolic, diastolic) {
    const category = this.categorizeBP(systolic, diastolic);
    
    if (category === 'hypertensive_crisis') {
      return {
        type: 'blood_pressure',
        severity: 'critical',
        message: 'Dangerously high blood pressure - seek immediate medical attention',
        values: { systolic, diastolic }
      };
    }
    
    if (category === 'stage_2_hypertension') {
      return {
        type: 'blood_pressure',
        severity: 'warning',
        message: 'High blood pressure - contact your doctor',
        values: { systolic, diastolic }
      };
    }
    
    if (systolic < 90 || diastolic < 60) {
      return {
        type: 'blood_pressure',
        severity: 'warning',
        message: 'Low blood pressure - monitor for dizziness',
        values: { systolic, diastolic }
      };
    }
    
    return null;
  }

  checkHRAlert(rate) {
    if (rate < 40 || rate > 150) {
      return {
        type: 'heart_rate',
        severity: 'critical',
        message: 'Abnormal heart rate - seek medical attention',
        value: rate
      };
    }
    
    if (rate < 50 || rate > 120) {
      return {
        type: 'heart_rate',
        severity: 'warning',
        message: 'Heart rate outside normal range',
        value: rate
      };
    }
    
    return null;
  }

  checkGlucoseAlert(value, type) {
    if (value < 70) {
      return {
        type: 'blood_sugar',
        severity: value < 54 ? 'critical' : 'warning',
        message: 'Low blood sugar - eat or drink something with sugar',
        value
      };
    }
    
    if (value > 300) {
      return {
        type: 'blood_sugar',
        severity: 'critical',
        message: 'Very high blood sugar - check for ketones and contact doctor',
        value
      };
    }
    
    if (type === 'fasting' && value > 126) {
      return {
        type: 'blood_sugar',
        severity: 'warning',
        message: 'Fasting glucose elevated',
        value
      };
    }
    
    return null;
  }

  checkTempAlert(temp, unit = 'F') {
    const fahrenheit = unit === 'C' ? (temp * 9/5) + 32 : temp;
    
    if (fahrenheit < 95) {
      return {
        type: 'temperature',
        severity: 'critical',
        message: 'Body temperature too low - seek warmth and medical help',
        value: temp
      };
    }
    
    if (fahrenheit > 103) {
      return {
        type: 'temperature',
        severity: 'warning',
        message: 'High fever - contact doctor if persists',
        value: temp
      };
    }
    
    return null;
  }

  checkO2Alert(level) {
    if (level < 88) {
      return {
        type: 'oxygen',
        severity: 'critical',
        message: 'Low oxygen levels - seek immediate medical attention',
        value: level
      };
    }
    
    if (level < 92) {
      return {
        type: 'oxygen',
        severity: 'warning',
        message: 'Oxygen levels below normal',
        value: level
      };
    }
    
    return null;
  }

  checkWeightChange(userId, currentWeight) {
    const records = this.vitalRecords.get(userId) || [];
    const recentWeights = records
      .filter(r => r.measurements.weight)
      .slice(-7); // Last 7 weight measurements
    
    if (recentWeights.length < 2) return null;
    
    const previousWeight = recentWeights[recentWeights.length - 2].measurements.weight.value;
    const change = currentWeight - previousWeight;
    const percentChange = (change / previousWeight) * 100;
    
    if (Math.abs(percentChange) > 5) {
      return {
        type: 'weight',
        severity: 'warning',
        message: `Significant weight ${change > 0 ? 'gain' : 'loss'} of ${Math.abs(change).toFixed(1)} lbs`,
        values: { current: currentWeight, previous: previousWeight, change }
      };
    }
    
    return null;
  }

  // Alert Processing
  processHealthAlerts(userId, alerts) {
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const warningAlerts = alerts.filter(a => a.severity === 'warning');
    
    if (criticalAlerts.length > 0) {
      this.triggerEmergencyProtocol(userId, criticalAlerts);
    }
    
    if (warningAlerts.length > 0) {
      this.notifyHealthWarnings(userId, warningAlerts);
    }
    
    // Store alerts for medical review
    this.storeAlerts(userId, alerts);
  }

  triggerEmergencyProtocol(userId, alerts) {
    const profile = this.profiles.get(userId);
    if (!profile) return;

    const emergency = {
      id: `emergency_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      timestamp: new Date(),
      alerts,
      status: 'active',
      actions: []
    };

    // Notify emergency contacts
    profile.emergencyContacts.forEach(contact => {
      emergency.actions.push({
        type: 'notify_contact',
        contact: contact.name,
        method: 'call_and_text',
        timestamp: new Date()
      });
    });

    // Alert medical professionals
    if (profile.primaryPhysician) {
      emergency.actions.push({
        type: 'notify_physician',
        physician: profile.primaryPhysician.name,
        timestamp: new Date()
      });
    }

    this.emit('emergencyProtocolActivated', emergency);
  }

  notifyHealthWarnings(userId, warnings) {
    this.emit('healthWarnings', {
      userId,
      warnings,
      timestamp: new Date(),
      recommendations: this.generateHealthRecommendations(warnings)
    });
  }

  generateHealthRecommendations(warnings) {
    const recommendations = [];
    
    warnings.forEach(warning => {
      switch (warning.type) {
        case 'blood_pressure':
          recommendations.push({
            action: 'monitor',
            frequency: 'every 4 hours',
            duration: '24 hours',
            instruction: 'Rest and avoid strenuous activity'
          });
          break;
        case 'blood_sugar':
          recommendations.push({
            action: 'recheck',
            timing: '15 minutes',
            instruction: 'Eat 15g of fast-acting carbohydrates if low'
          });
          break;
        case 'heart_rate':
          recommendations.push({
            action: 'rest',
            duration: '10 minutes',
            instruction: 'Sit quietly and recheck'
          });
          break;
      }
    });
    
    return recommendations;
  }

  storeAlerts(userId, alerts) {
    const alertHistory = {
      userId,
      timestamp: new Date(),
      alerts,
      reviewed: false,
      reviewedBy: null,
      reviewedAt: null
    };
    
    // In production, this would persist to a database
    this.emit('alertsStored', alertHistory);
  }

  // Medication Management
  addMedication(userId, medication) {
    const userMeds = this.medications.get(userId) || [];
    
    const med = {
      id: `med_${crypto.randomBytes(8).toString('hex')}`,
      name: medication.name,
      genericName: medication.genericName,
      dosage: medication.dosage,
      frequency: medication.frequency,
      route: medication.route || 'oral',
      purpose: medication.purpose,
      prescribedBy: medication.prescribedBy,
      prescribedDate: medication.prescribedDate,
      instructions: medication.instructions || '',
      withFood: medication.withFood || false,
      interactions: medication.interactions || [],
      sideEffects: medication.sideEffects || [],
      refills: medication.refills || 0,
      refillDate: medication.refillDate,
      active: true,
      adherence: {
        taken: 0,
        missed: 0,
        rate: 100
      }
    };
    
    userMeds.push(med);
    this.medications.set(userId, userMeds);
    
    // Set up medication reminders
    this.setupMedicationReminders(userId, med);
    
    this.emit('medicationAdded', { userId, medication: med });
    return med;
  }

  setupMedicationReminders(userId, medication) {
    // This would integrate with the reminder system
    const times = this.calculateMedicationTimes(medication.frequency);
    
    times.forEach(time => {
      this.emit('createReminder', {
        userId,
        type: 'medication',
        medicationId: medication.id,
        time,
        message: `Time to take ${medication.name} (${medication.dosage})`,
        repeat: 'daily',
        critical: true
      });
    });
  }

  calculateMedicationTimes(frequency) {
    const times = {
      'once daily': ['08:00'],
      'twice daily': ['08:00', '20:00'],
      'three times daily': ['08:00', '14:00', '20:00'],
      'four times daily': ['08:00', '12:00', '16:00', '20:00'],
      'every 6 hours': ['06:00', '12:00', '18:00', '00:00'],
      'every 8 hours': ['08:00', '16:00', '00:00'],
      'as needed': []
    };
    
    return times[frequency] || times['once daily'];
  }

  recordMedicationTaken(userId, medicationId, taken = true) {
    const userMeds = this.medications.get(userId) || [];
    const medication = userMeds.find(m => m.id === medicationId);
    
    if (!medication) return null;
    
    const record = {
      medicationId,
      timestamp: new Date(),
      taken,
      notes: ''
    };
    
    // Update adherence
    if (taken) {
      medication.adherence.taken++;
    } else {
      medication.adherence.missed++;
    }
    
    const total = medication.adherence.taken + medication.adherence.missed;
    medication.adherence.rate = Math.round((medication.adherence.taken / total) * 100);
    
    this.emit('medicationRecorded', { userId, medication, record });
    return record;
  }

  // Symptom Tracking
  recordSymptom(userId, symptom) {
    const userSymptoms = this.symptoms.get(userId) || [];
    
    const record = {
      id: `symptom_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      timestamp: new Date(),
      type: symptom.type,
      severity: symptom.severity, // 1-10 scale
      duration: symptom.duration,
      description: symptom.description,
      triggers: symptom.triggers || [],
      relievedBy: symptom.relievedBy || [],
      affectsDaily: symptom.affectsDaily || false,
      needsAttention: symptom.severity >= 7
    };
    
    userSymptoms.push(record);
    this.symptoms.set(userId, userSymptoms);
    
    // Check for concerning patterns
    this.analyzeSymptomPatterns(userId, record);
    
    this.emit('symptomRecorded', record);
    return record;
  }

  analyzeSymptomPatterns(userId, newSymptom) {
    const userSymptoms = this.symptoms.get(userId) || [];
    const recentSymptoms = userSymptoms.filter(s => {
      const daysDiff = (new Date() - new Date(s.timestamp)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7 && s.type === newSymptom.type;
    });
    
    // Check for recurring symptoms
    if (recentSymptoms.length >= 3) {
      this.emit('symptomPattern', {
        userId,
        pattern: 'recurring',
        symptomType: newSymptom.type,
        occurrences: recentSymptoms.length,
        recommendation: 'Consider consulting your doctor about recurring symptoms'
      });
    }
    
    // Check for worsening symptoms
    if (recentSymptoms.length > 0) {
      const severities = recentSymptoms.map(s => s.severity);
      const avgSeverity = severities.reduce((a, b) => a + b, 0) / severities.length;
      
      if (newSymptom.severity > avgSeverity + 2) {
        this.emit('symptomPattern', {
          userId,
          pattern: 'worsening',
          symptomType: newSymptom.type,
          change: newSymptom.severity - avgSeverity,
          recommendation: 'Symptom appears to be worsening - monitor closely'
        });
      }
    }
  }

  // Appointment Management
  scheduleAppointment(userId, appointment) {
    const userAppointments = this.appointments.get(userId) || [];
    
    const appt = {
      id: `appt_${crypto.randomBytes(8).toString('hex')}`,
      userId,
      created: new Date(),
      scheduledFor: new Date(appointment.date + ' ' + appointment.time),
      type: appointment.type, // 'routine', 'follow-up', 'specialist', 'emergency'
      provider: appointment.provider,
      location: appointment.location,
      reason: appointment.reason,
      preparation: appointment.preparation || [],
      transportation: appointment.transportation || 'self',
      status: 'scheduled',
      reminders: []
    };
    
    userAppointments.push(appt);
    this.appointments.set(userId, userAppointments);
    
    // Set up appointment reminders
    this.setupAppointmentReminders(userId, appt);
    
    this.emit('appointmentScheduled', appt);
    return appt;
  }

  setupAppointmentReminders(userId, appointment) {
    const reminders = [
      { timing: '1 day before', message: 'Doctor appointment tomorrow' },
      { timing: '2 hours before', message: 'Doctor appointment in 2 hours' },
      { timing: '30 minutes before', message: 'Time to leave for appointment' }
    ];
    
    reminders.forEach(reminder => {
      this.emit('createReminder', {
        userId,
        type: 'appointment',
        appointmentId: appointment.id,
        timing: reminder.timing,
        message: `${reminder.message} with ${appointment.provider}`,
        priority: 'high'
      });
    });
  }

  // Wellness Score Calculation
  updateWellnessScore(userId, vitalRecord) {
    const profile = this.profiles.get(userId);
    if (!profile) return;

    const scores = {
      vitals: this.calculateVitalScore(vitalRecord),
      medication: this.calculateMedicationScore(userId),
      activity: this.calculateActivityScore(userId),
      symptoms: this.calculateSymptomScore(userId)
    };
    
    const overallScore = Math.round(
      (scores.vitals * 0.4) +
      (scores.medication * 0.3) +
      (scores.activity * 0.2) +
      (scores.symptoms * 0.1)
    );
    
    const wellness = {
      userId,
      timestamp: new Date(),
      overallScore,
      components: scores,
      trend: this.calculateWellnessTrend(userId, overallScore),
      recommendations: this.generateWellnessRecommendations(scores)
    };
    
    this.emit('wellnessUpdated', wellness);
    return wellness;
  }

  calculateVitalScore(vitalRecord) {
    let score = 100;
    
    // Deduct points for abnormal readings
    vitalRecord.alerts.forEach(alert => {
      if (alert.severity === 'critical') score -= 30;
      else if (alert.severity === 'warning') score -= 15;
    });
    
    return Math.max(0, score);
  }

  calculateMedicationScore(userId) {
    const userMeds = this.medications.get(userId) || [];
    if (userMeds.length === 0) return 100;
    
    const totalAdherence = userMeds.reduce((sum, med) => sum + med.adherence.rate, 0);
    return Math.round(totalAdherence / userMeds.length);
  }

  calculateActivityScore(userId) {
    // This would integrate with activity tracking
    return 75; // Placeholder
  }

  calculateSymptomScore(userId) {
    const userSymptoms = this.symptoms.get(userId) || [];
    const recentSymptoms = userSymptoms.filter(s => {
      const daysDiff = (new Date() - new Date(s.timestamp)) / (1000 * 60 * 60 * 24);
      return daysDiff <= 7;
    });
    
    if (recentSymptoms.length === 0) return 100;
    
    const avgSeverity = recentSymptoms.reduce((sum, s) => sum + s.severity, 0) / recentSymptoms.length;
    return Math.max(0, 100 - (avgSeverity * 10));
  }

  calculateWellnessTrend(userId, currentScore) {
    // Would compare with historical scores
    return 'stable'; // Placeholder
  }

  generateWellnessRecommendations(scores) {
    const recommendations = [];
    
    if (scores.vitals < 70) {
      recommendations.push({
        area: 'vitals',
        priority: 'high',
        action: 'Monitor vitals more frequently and consult doctor if abnormal'
      });
    }
    
    if (scores.medication < 80) {
      recommendations.push({
        area: 'medication',
        priority: 'medium',
        action: 'Use medication reminders and pill organizers'
      });
    }
    
    if (scores.activity < 60) {
      recommendations.push({
        area: 'activity',
        priority: 'medium',
        action: 'Try gentle exercises like walking or chair yoga'
      });
    }
    
    return recommendations;
  }

  // Health Reports
  generateHealthReport(userId, period = 'week') {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const vitals = this.getVitalsInRange(userId, startDate, endDate);
    const symptoms = this.getSymptomsInRange(userId, startDate, endDate);
    const medications = this.medications.get(userId) || [];
    const appointments = this.getAppointmentsInRange(userId, startDate, endDate);

    return {
      userId,
      period,
      generated: new Date(),
      summary: {
        vitalReadings: vitals.length,
        symptomReports: symptoms.length,
        medicationAdherence: this.calculatePeriodAdherence(medications, period),
        appointments: appointments.length
      },
      vitals: this.summarizeVitals(vitals),
      symptoms: this.summarizeSymptoms(symptoms),
      medications: this.summarizeMedications(medications),
      appointments: appointments,
      trends: this.identifyHealthTrends(vitals, symptoms),
      recommendations: this.generateReportRecommendations(vitals, symptoms, medications)
    };
  }

  getVitalsInRange(userId, startDate, endDate) {
    const userRecords = this.vitalRecords.get(userId) || [];
    return userRecords.filter(r => 
      r.timestamp >= startDate && r.timestamp <= endDate
    );
  }

  getSymptomsInRange(userId, startDate, endDate) {
    const userSymptoms = this.symptoms.get(userId) || [];
    return userSymptoms.filter(s => 
      new Date(s.timestamp) >= startDate && new Date(s.timestamp) <= endDate
    );
  }

  getAppointmentsInRange(userId, startDate, endDate) {
    const userAppointments = this.appointments.get(userId) || [];
    return userAppointments.filter(a => 
      a.scheduledFor >= startDate && a.scheduledFor <= endDate
    );
  }

  calculatePeriodAdherence(medications, period) {
    // Simplified calculation
    const activeMeds = medications.filter(m => m.active);
    if (activeMeds.length === 0) return 100;
    
    const totalAdherence = activeMeds.reduce((sum, med) => sum + med.adherence.rate, 0);
    return Math.round(totalAdherence / activeMeds.length);
  }

  summarizeVitals(vitals) {
    const summary = {
      bloodPressure: { readings: 0, average: null, trend: null },
      heartRate: { readings: 0, average: null, trend: null },
      bloodSugar: { readings: 0, average: null, trend: null }
    };

    // Calculate averages and trends
    // Implementation would process vital records
    
    return summary;
  }

  summarizeSymptoms(symptoms) {
    const typeCount = {};
    symptoms.forEach(s => {
      typeCount[s.type] = (typeCount[s.type] || 0) + 1;
    });
    
    return {
      total: symptoms.length,
      byType: typeCount,
      averageSeverity: symptoms.length > 0 ? 
        symptoms.reduce((sum, s) => sum + s.severity, 0) / symptoms.length : 0
    };
  }

  summarizeMedications(medications) {
    return medications.map(med => ({
      name: med.name,
      adherence: med.adherence.rate,
      missedDoses: med.adherence.missed,
      refillNeeded: this.checkRefillNeeded(med)
    }));
  }

  checkRefillNeeded(medication) {
    if (!medication.refillDate) return false;
    
    const refillDate = new Date(medication.refillDate);
    const daysUntilRefill = (refillDate - new Date()) / (1000 * 60 * 60 * 24);
    
    return daysUntilRefill <= 7;
  }

  identifyHealthTrends(vitals, symptoms) {
    // Analyze patterns in vitals and symptoms
    // Implementation would use statistical analysis
    return {
      improving: [],
      stable: ['blood_pressure', 'heart_rate'],
      concerning: []
    };
  }

  generateReportRecommendations(vitals, symptoms, medications) {
    const recommendations = [];
    
    // Based on analysis of health data
    // Implementation would provide personalized recommendations
    
    return recommendations;
  }

  // Emergency Protocols
  initializeEmergencyProtocol(userId, type) {
    const profile = this.profiles.get(userId);
    if (!profile) return null;

    const protocol = {
      fall_detection: {
        actions: [
          'Check responsiveness',
          'Call emergency contacts',
          'Alert medical services if unresponsive',
          'Monitor vitals if possible'
        ],
        contacts: ['emergency', 'primary']
      },
      cardiac_event: {
        actions: [
          'Call 911 immediately',
          'Administer aspirin if available',
          'Keep person calm and seated',
          'Monitor vitals continuously'
        ],
        contacts: ['911', 'emergency', 'physician']
      },
      stroke_symptoms: {
        actions: [
          'Call 911 immediately',
          'Note time symptoms started',
          'Keep person comfortable',
          'Do not give food or drink'
        ],
        contacts: ['911', 'emergency']
      }
    };

    return protocol[type] || protocol.fall_detection;
  }

  // Initialize default health metrics
  initializeHealthMetrics() {
    this.healthMetrics = {
      vital_ranges: {
        blood_pressure: { normal: '120/80', concern: '140/90', critical: '180/120' },
        heart_rate: { normal: '60-100', concern: '<50 or >120', critical: '<40 or >150' },
        blood_sugar: { normal: '70-140', concern: '<70 or >200', critical: '<54 or >300' },
        temperature: { normal: '97-99°F', concern: '<96 or >100.4°F', critical: '<95 or >103°F' },
        oxygen: { normal: '>95%', concern: '90-94%', critical: '<90%' }
      },
      medication_schedules: {
        morning: '8:00 AM',
        noon: '12:00 PM',
        evening: '6:00 PM',
        bedtime: '9:00 PM'
      }
    };
  }
}

module.exports = HealthMonitor;