# Real-Time Sports Injury Monitoring System Based on AI & ML

A production-oriented, multi-modal AI decision-support platform designed to monitor physical movement biomechanics, physiological wearable telemetry, athlete self-assessments, and musculoskeletal MRI scans.

> **CRITICAL MEDICAL DISCLAIMER**  
> This software system provides AI-based statistical risk indicators and decision-support metrics for athletic performance and training load monitoring. **It does NOT provide medical diagnoses, clinical prognoses, treatment plans, or proof of anatomical lesions.** All indices, scores, and alerts represent statistical decision-support indicators and must not replace direct evaluation by qualified healthcare and sports medicine professionals.

---

## Table of Contents
1. [Executive Summary & Motivation](#1-executive-summary--motivation)
2. [End-to-End System Architecture](#2-end-to-end-system-architecture)
3. [Core Information Streams](#3-core-information-streams)
4. [Machine Learning & Computer Vision Pipeline](#4-machine-learning--computer-vision-pipeline)
5. [Multi-Modal Risk Fusion Engine](#5-multi-modal-risk-fusion-engine)
6. [Temporal Monitoring & Personal Baseline Tracking](#6-temporal-monitoring--personal-baseline-tracking)
7. [Athlete Self-Assessment & NLP Symptom Extraction](#7-athlete-self-assessment--nlp-symptom-extraction)
8. [Musculoskeletal MRI Analysis & Explainability](#8-musculoskeletal-mri-analysis--explainability)
9. [Intelligent Multi-Level Alert Engine](#9-intelligent-multi-level-alert-engine)
10. [Persistent SQLite Database Schema](#10-persistent-sqlite-database-schema)
11. [REST & WebSocket API Reference](#11-rest--websocket-api-reference)
12. [Light Professional Dashboard (Frontend)](#12-light-professional-dashboard-frontend)
13. [Installation & Operational Guide](#13-installation--operational-guide)
14. [Dataset Management & Quality Assurance](#14-dataset-management--quality-assurance)
15. [Verification & Testing](#15-verification--testing)
16. [Security, Privacy, and Ethical AI Standards](#16-security-privacy-and-ethical-ai-standards)

---

## 1. Executive Summary & Motivation

Sports injury etiology is inherently multi-factorial. Traditional monitoring systems often rely on a single data modality—such as GPS tracking, heart rate monitors, or subjective wellness questionnaires. Isolated metrics fail to capture the complex interplay between physical biomechanics, internal physiological strain, subjective athlete feedback, and structural tissue health.

The **Real-Time Sports Injury Monitoring System** synthesizes four foundational information sources into a unified, calibrated decision-support platform:
1. **Physical Movement Biomechanics**: Joint angles, angular velocities, ground reaction force, and instability indices.
2. **Wearable Physiological Telemetry**: Heart rate, $\text{SpO}_2$, skin temperature, EMG muscle activation, training load, and hydration.
3. **Athlete Self-Assessment & Subjective Symptoms**: Pain (0–10), fatigue (0–10), specific functional symptoms, and free-text sentiment processed via NLP.
4. **Musculoskeletal MRI Imaging**: Automated image quality verification, transfer learning deep feature extraction (EfficientNet-B0), 4-level injury severity grading, and Grad-CAM attention heatmap visualization.

---

## 2. End-to-End System Architecture

```
                                      ATHLETE
                                         │
        ┌────────────────────────────────┼────────────────────────────────┐
        ▼                                ▼                                ▼
 ┌───────────────┐               ┌───────────────┐               ┌────────────────┐
 │SELF-ASSESSMENT│               │   MRI SCAN    │               │  SENSOR DATA   │
 └───────┬───────┘               └───────┬───────┘               └────────┬───────┘
         │                               │                                │
         ▼                               ▼                                ▼
 ┌───────────────┐               ┌───────────────┐               ┌────────────────┐
 │  NLP SYMPTOM  │               │CNN (Efficient-│               │  SENSOR MODEL  │
 │  EXTRACTION   │               │ Net-B0 Head)  │               │   (XGBoost)    │
 └───────┬───────┘               └───────┬───────┘               └────────┬───────┘
         │                               │                                │
         └───────────────────────┬───────┴────────────────────────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ PHYSICAL MOVEMENT ML  │
                     │    (Decision Tree)    │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │ FEATURE NORMALIZATION │
                     │   & PERSONAL BASELINE │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │  RISK FUSION ENGINE   │
                     │  (Weights + EMA +     │
                     │  Escalation Triggers) │
                     └───────────┬───────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
     ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
     │ Risk Score  │      │Risk Factors │      │    Trend    │
     │  (0 - 100%) │      │& Attribution│      │Trajectory   │
     └──────┬──────┘      └──────┬──────┘      └──────┬──────┘
            └────────────────────┼────────────────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │  LIGHT PROFESSIONAL   │
                     │  NEXT.JS DASHBOARD    │
                     └───────────┬───────────┘
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │  AUDITABLE DATABASE,  │
                     │ ALERTS & JSON/CSV REPS│
                     └───────────────────────┘
```

---

## 3. Core Information Streams

### A. Physical Movement & Biomechanics
Captures kinematic and dynamic variables during athletic maneuvers (running, cutting, jumping, landing):
* **Joint Kinematics**: Hip flexion angle ($^\circ$), knee flexion angle ($^\circ$), ankle rotation angle ($^\circ$).
* **Dynamic Indicators**: Angular velocity ($\text{rad/s}$), linear acceleration ($\text{m/s}^2$), ground reaction force ($\text{N}$).
* **Instability & Deviations**: Postural instability index ($[0, 1]$), biomechanical deviation score ($[0, 1]$), lateral movement asymmetry ($^\circ$).

### B. Wearable Physiological Telemetry
Continuous cardiovascular, metabolic, and muscular data:
* **Cardiovascular**: Continuous heart rate ($\text{BPM}$), blood oxygen saturation $\text{SpO}_2$ ($\%$).
* **Thermal & Neuromuscular**: Skin temperature ($^\circ\text{C}$), surface electromyography muscle activation ($\text{EMG}$).
* **Load & Hydration**: Cumulative training workload units, hydration ratio ($[0, 1]$), autonomic stress index ($[0, 1]$).

### C. Athlete Self-Assessment & Subjective Symptoms
Standardized daily intake providing clinical context that sensors cannot directly observe:
* **Pain Assessment**: Numeric Rating Scale ($0\text{--}10$), anatomical body regions, rest vs. active pain.
* **Symptom Flags**: Muscle soreness, joint stiffness, localized swelling, weakness, numbness/tingling, reduced range of motion, functional locomotion difficulties.
* **Context**: Training duration, perceived recovery, prior injuries, and free-text notes.

### D. Musculoskeletal MRI Scans
Diagnostic imaging input for high-acuity evaluation:
* **Image Formats**: PNG, JPG, JPEG, WEBP, BMP, TIFF.
* **Preprocessing**: Automated dimension validation, contrast verification, and artifact/corruption detection.

---

## 4. Machine Learning & Computer Vision Pipeline

### A. Biomechanical Feature Engineering
Raw movement observations are transformed into domain-specific biomechanical stress metrics:
1. **Movement Intensity**: $\text{Angular Velocity} \times \text{Linear Acceleration}$
2. **Biomechanical Risk Index**: $0.5 \times \text{Postural Instability} + 0.5 \times \text{Biomechanical Deviation}$
3. **Movement Asymmetry**: $|\text{Left Knee Angle} - \text{Right Knee Angle}|$
4. **Fatigue-GRF Interaction**: $\text{Fatigue Level} \times \text{Ground Reaction Force}$

### B. Physiological Feature Engineering
1. **Fatigue-Adjusted Workload**: $\text{Training Load} \times (1.0 + \text{Sensor Fatigue Index})$
2. **Physiological Stress Score**:
   $$\text{Stress Score} = 0.4 \times \left(\frac{\text{HR} - 55}{135}\right) + 0.3 \times \left(1.0 - \frac{\text{SpO}_2 - 90}{10}\right) + 0.3 \times \text{Stress Index}$$
3. **Recovery Index**: $\text{Hydration Level} \times (1.0 - \text{Stress Index})$
4. **Cardiovascular Load**: $\text{Heart Rate} \times \text{Training Workload}$

### C. Model Training & Comparison
Models are benchmarked across multiple algorithms:
* **Logistic Regression** (Linear baseline)
* **Support Vector Machines (SVM)** (RBF kernel)
* **Random Forest & Decision Trees** (Ensemble tree models)
* **XGBoost & Gradient Boosting** (Gradient-boosted decision trees)

Models are evaluated on holdout stratified test splits using un-fabricated metrics:
* Accuracy, Precision, Recall (Sensitivity), Specificity, F1-Score, ROC-AUC, and PR-AUC.
* Recall on positive injury-risk instances is heavily prioritized in model selection.

---

## 5. Multi-Modal Risk Fusion Engine

The Risk Fusion Engine (`backend/risk_engine.py`) synthesizes sub-model inferences into a unified injury-risk indicator.

### Mathematical Formulation

$$\text{Fused Risk}_t = w_m \cdot P(\text{Movement}) + w_s \cdot P(\text{Sensor}) + w_{sa} \cdot S(\text{Self-Assessment}) + w_{\text{mri}} \cdot S(\text{MRI}) + w_t \cdot T(\text{Trend})$$

#### Configurable Weight Allocation (`config/risk_fusion.json`):
* **With MRI Available**:
  * Movement Weight ($w_m$): $0.30$
  * Sensor Weight ($w_s$): $0.25$
  * Self-Assessment Weight ($w_{sa}$): $0.20$
  * MRI Weight ($w_{\text{mri}}$): $0.15$
  * Temporal Trend Weight ($w_t$): $0.10$
* **Fallback Redistribution (Without MRI)**:
  * Movement Weight ($w_m$): $0.35$
  * Sensor Weight ($w_s$): $0.30$
  * Self-Assessment Weight ($w_{sa}$): $0.25$
  * Temporal Trend Weight ($w_t$): $0.10$

### Single-Indicator Escalation Trigger
If any individual modality detects extreme risk ($\ge 0.85$):
$$\text{Fused Risk}_t \leftarrow \max(\text{Fused Risk}_t, 0.75)$$
This ensures critical localized anomalies (such as an acute MRI lesion or severe pain) are not diluted by normal readings in other streams.

### Exponential Moving Average (EMA) Smoothing
To prevent erratic frame-by-frame fluctuations during continuous telemetry:
$$\text{Smoothed Risk}_t = \alpha \cdot \text{Fused Risk}_t + (1 - \alpha) \cdot \text{Smoothed Risk}_{t-1} \quad (\alpha = 0.30)$$

### Application-Level Risk Categories
* **LOW RISK** ($0.0\%\text{--}39.9\%$): Green (`#10b981`). Parameters remain within personal baseline tolerances.
* **MODERATE RISK** ($40.0\%\text{--}69.9\%$): Amber (`#f59e0b`). Noticeable load or fatigue accumulation. Load modulation recommended.
* **HIGH RISK** ($70.0\%\text{--}100.0\%$): Red (`#ef4444`). Critical biomechanical deviation or extreme physiological strain. Activity cessation advised.

---

## 6. Temporal Monitoring & Personal Baseline Tracking

Rather than analyzing every session in isolation, the system models each athlete's longitudinal data:

### A. Personalized Baseline Envelope
For each athlete, the service tracks a rolling distribution of nominal parameters:
$$\text{Baseline} = \mu \pm 2\sigma$$
Current values are mapped to statistical z-scores:
$$z = \frac{x - \mu}{\max(\sigma, 10^{-4})}$$
Observations with $|z| > 2.0$ trigger individual anomaly flags.

### B. Temporal Trend Classification
Using a rolling window of recent sessions ($N=7$), the service fits a linear regression:
* **RISING**: Positive slope ($> 0.008$) or sudden spike ($\Delta \ge 25\%$ within 3 sessions).
* **FALLING**: Negative slope ($< -0.008$), reflecting progressive recovery.
* **STABLE**: Trajectory within nominal variance bounds.

---

## 7. Athlete Self-Assessment & NLP Symptom Extraction

The system ingests athlete self-reports via an interactive form (`/assessment`) and extracts structured indicators using regex-based NLP entity extraction (`backend/services/nlp_service.py`):

* **Symptom Lexicon**: Pain, aching, soreness, tenderness, stiffness, rigidity, swelling, inflammation, weakness, instability, numbness, tingling.
* **Anatomical Body Regions**: Knee, patella, ankle, achilles, hip, groin, hamstring, quadriceps, shoulder, lower back.
* **Training Context**: Associations with sprinting, decelerating, tackling, jumping, or match play.

**Resulting Output Example**:
```json
{
  "pain_detected": true,
  "detected_symptoms": ["pain", "stiffness"],
  "body_regions": ["knee"],
  "training_related": true,
  "overall_risk_score": 0.64,
  "status_label": "Elevated Risk Indicators"
}
```

---

## 8. Musculoskeletal MRI Analysis & Explainability

The MRI analysis pipeline (`backend/services/mri_service.py`) provides automated image-based decision support:

### A. Quality Validation Gates
Uploaded scans pass strict validation before model ingestion:
* **Byte Size Check**: Files exceeding $25\,\text{MB}$ rejected.
* **Dimension Check**: Minimum resolution $64 \times 64\,\text{pixels}$.
* **Blank/Solid Image Detection**: Pixel intensity standard deviation $\sigma \ge 2.0$ required.
* **Format Verification**: Supports JPG, PNG, WEBP, BMP, and TIFF.

### B. Deep Feature Extraction & Radiological Proxies
* **Deep Features**: 1280-dimensional feature representations extracted using ImageNet-pretrained **EfficientNet-B0**.
* **Radiological Proxies**: Local contrast (heterogeneity), Sobel gradient edge density (tissue boundaries), dark region ratio (edema/fluid pools), and texture complexity.

### C. 4-Grade Severity Classification
* **Grade 0 (No Injury)**: Intensity score $< 0.28$. Tissue patterns within anatomical baseline.
* **Grade 1 (Mild)**: Intensity score $0.28\text{--}0.51$. Minor soft tissue signal variations.
* **Grade 2 (Moderate)**: Intensity score $0.52\text{--}0.73$. Noticeable structural signal discontinuity.
* **Grade 3 (Severe)**: Intensity score $\ge 0.74$. Substantial tissue disruption or high-intensity edema pattern.

### D. Attention Heatmap Visualization (Grad-CAM)
Generates an attention heatmap overlay in Base64 JPEG showing salient image regions that influenced the model's score. Clearly disclaimed as an AI statistical visualization, not clinical proof of pathology.

---

## 9. Intelligent Multi-Level Alert Engine

The alert engine (`backend/services/alert_engine.py`) monitors telemetry frames and dispatches categorized alerts:

| Alert ID | Name | Severity | Condition |
|---|---|---|---|
| `ALT-SUDDEN-SPIKE` | Sudden Risk Spike | `HIGH PRIORITY` | $\Delta \text{Risk} \ge 0.25$ within 3 consecutive sessions |
| `ALT-PERSIST-HIGH` | Persistent Elevated Risk | `HIGH PRIORITY` | $\text{Smoothed Risk} \ge 70\%$ for $\ge 3$ consecutive frames |
| `ALT-SEVERE-PAIN` | Severe Subjective Pain | `HIGH PRIORITY` | Reported pain score $\ge 7/10$ |
| `ALT-HIGH-FATIGUE` | Critical Fatigue Level | `WARNING` | Subjective or sensor fatigue index $\ge 80\%$ |
| `ALT-ABNORMAL-KIN` | Abnormal Joint Kinematics | `WARNING` | Biomechanical deviation score $\ge 0.65$ or asymmetry $\ge 22^\circ$ |
| `ALT-PHYSIO-STRESS`| Physiological Stress Strain | `WARNING` | $\text{Heart Rate} > 175\,\text{BPM}$ and $\text{SpO}_2 < 93\%$ |
| `ALT-HIGH-LOAD` | Excessive Cumulative Workload| `INFO` | Training workload units $\ge 390$ |
| `ALT-POOR-RECOVERY`| Sub-optimal Recovery | `INFO` | Recovery score $\le 0.30$ and hydration $< 40\%$ |

All alerts persist in SQLite with acknowledgment and resolution tracking.

---

## 10. Persistent SQLite Database Schema

Stored in `sports_monitoring.db` with WAL mode enabled:

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      USERS       │       │     ATHLETES     │       │     SESSIONS     │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │◄──────│ id (PK)          │
│ username         │       │ name             │       │ athlete_id (FK)  │
│ password_hash    │       │ age              │       │ type             │
│ role             │       │ position         │       │ start_time       │
│ athlete_id       │       │ sport            │       │ end_time         │
│ created_at       │       │ current_risk     │       │ duration_min     │
└──────────────────┘       │ current_fatigue  │       │ peak_risk        │
                           │ current_load     │       │ avg_risk         │
                           │ baseline_metrics │       │ peak_hr          │
                           └────────┬─────────┘       │ alerts_count     │
                                    │                 │ status           │
          ┌─────────────────────────┼─────────────────┴────────┬─────────┘
          │                         │                          │
          ▼                         ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│ SELF_ASSESSMENTS │       │   MEASUREMENTS   │       │      ALERTS      │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (AUTO PK)     │       │ id (PK)          │
│ athlete_id (FK)  │       │ session_id (FK)  │       │ athlete_id (FK)  │
│ timestamp        │       │ athlete_id (FK)  │       │ session_id (FK)  │
│ pain_level       │       │ timestamp        │       │ timestamp        │
│ pain_locations   │       │ data_json        │       │ severity         │
│ fatigue_level    │       └──────────────────┘       │ reason           │
│ symptoms         │                                  │ acknowledged     │
│ description      │       ┌──────────────────┐       │ resolved         │
│ extracted_symp   │       │   MRI_RECORDS    │       └──────────────────┘
│ overall_risk     │       ├──────────────────┤
│ status_label     │       │ id (PK)          │       ┌──────────────────┐
└──────────────────┘       │ athlete_id (FK)  │       │ RISK_PREDICTIONS │
                           │ timestamp        │       ├──────────────────┤
                           │ filename         │       │ id (PK)          │
                           │ grade            │       │ athlete_id (FK)  │
                           │ severity         │       │ session_id (FK)  │
                           │ confidence       │       │ timestamp        │
                           │ injury_score     │       │ overall_risk     │
                           │ radio_features   │       │ movement_risk    │
                           │ recommendation   │       │ sensor_risk      │
                           └──────────────────┘       │ level            │
                                                      │ trend            │
                                                      └──────────────────┘
```

---

## 11. REST & WebSocket API Reference

The backend runs on `http://localhost:8000`. Interactive OpenAPI documentation is available at `/docs`.

### Authentication
* `POST /api/auth/login` — Authenticate username and password; returns JWT token.
* `GET /api/auth/me` — Return authenticated identity and role permissions.

### Athlete Management
* `GET /api/athletes` — List all monitored athletes.
* `GET /api/athletes/{athlete_id}` — Get profile and personal baseline parameters.
* `GET /api/athletes/{athlete_id}/history` — Get historical risk progression and scans.

### Multi-Modal ML Inferences
* `POST /api/movement/predict` — Physical movement model risk inference.
* `POST /api/sensor/predict` — Physiological sensor model risk inference.
* `POST /api/assessment` — Submit athlete check-in; runs NLP extraction.
* `POST /api/mri/analyze` — Multipart upload of MRI image; runs grading and Grad-CAM.
* `POST /api/risk/fusion` — Multimodal risk fusion endpoint.

### Real-Time Streaming & Simulation
* `WS /ws/monitor/{athlete_id}` — 1Hz WebSocket streaming joint angles, sensors, and risk.
* `POST /api/simulation/start?scenario={scenario}` — Switch simulation mode (`normal_training`, `fatigued_overload`).
* `POST /api/simulation/stop` — Pause live telemetry simulation.

### Alerts, Reporting & Admin
* `GET /api/alerts?level={level}` — Filter alerts by severity.
* `POST /api/alerts/{alert_id}/acknowledge` — Mark alert as acknowledged.
* `POST /api/alerts/{alert_id}/resolve` — Mark alert as resolved.
* `GET /api/analytics/recovery` — Compute AI-derived recovery indicator.
* `GET /api/reports/{athlete_id}?format=json|csv` — Export comprehensive athlete summary report.
* `GET /api/dashboard` — Team-wide risk distribution overview.
* `GET /api/system/status` — Operational health status of backend, database, models, and WebSocket.
* `GET /api/dataset/quality-report` — Automated audit report across all registered datasets.
* `GET /api/evaluation/models` — Holdout test metrics for all production models.

---

## 12. Light Professional Dashboard (Frontend)

Built with **Next.js 16**, **React 19**, **Tailwind CSS**, and **Recharts**, styled in a **Light Professional Clinical Theme** with clean white cards (`#ffffff`), soft slate backgrounds (`#f8fafc`), and medical status accents:

* **`/` (Dashboard)**: Central command view with the Athlete Risk circular gauge, multi-modal component breakdown bars, real-time rolling 60-frame progression chart, joint kinematics, and active alert notifications.
* **`/live` (Live Monitor)**: Full-screen telemetry stream with 1Hz latency monitoring and sensor cards.
* **`/assessment` (Self-Assessment)**: Subjective intake form with interactive sliders, body location selectors, and real-time NLP symptom extraction.
* **`/mri` (MRI Analysis Portal)**: Drag-and-drop MRI upload, automated quality checks, 4-level injury severity grade, and Grad-CAM attention heatmap.
* **`/athletes` & `/athletes/[id]` (Athletes & Profiles)**: Roster view with personal baseline kinematics ($\mu \pm 2\sigma$) and z-score deviation metrics.
* **`/alerts` (Alert Center)**: Multi-level alert feed with filtering (`HIGH PRIORITY`, `WARNING`, `INFO`) and one-click acknowledgment.
* **`/reports` (Reports)**: Single-click report generation with instant download in CSV or JSON format.
* **`/evaluation` (AI Model Evaluation)**: Model performance cards, confusion matrix metrics, and ROC curves.
* **`/admin` (Admin & Coaching Matrix)**: Squad-level risk distribution, active monitoring count, and dataset quality reports.
* **`/settings` (Settings)**: Interactive weight adjustment sliders for the 5-input risk fusion engine.

---

## 13. Installation & Operational Guide

### Prerequisites
* **Python**: 3.10+ (Python 3.13 supported)
* **Node.js**: 18+ (Node 20+ recommended)
* **Operating System**: Windows, Linux, or macOS

### Step 1: Backend Setup
```bash
# Clone repository
git clone <repository-url>
cd "sports monitoring system"

# Install backend dependencies
pip install fastapi uvicorn pydantic scikit-learn torch torchvision xgboost pandas numpy pillow psutil

# Start the unified FastAPI backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
The backend initializes the SQLite database schema on startup and loads all models into memory.
* Backend API: `http://localhost:8000`
* Swagger Documentation: `http://localhost:8000/docs`

### Step 2: Dashboard Frontend Setup
```bash
cd dashboard

# Install dependencies
npm install

# For production deployment:
npm run build
npm start

# Or for development:
npm run dev
```
* Dashboard URL: `http://localhost:3000`

---

## 14. Dataset Management & Quality Assurance

All datasets are indexed in `dataset_registry.json`. The automated dataset ingestion engine (`backend/dataset_manager.py`) validates every file:
* **Missing Value Auditing**: Identifies incomplete records.
* **Duplicate Detection**: Flags identical timestamps and readings.
* **Physiological Range Boundaries**:
  * Heart Rate: $35\text{--}230\,\text{BPM}$
  * $\text{SpO}_2$: $75\text{--}100\%$
  * Skin Temperature: $28\text{--}43^\circ\text{C}$
  * Knee Flexion Angle: $30\text{--}190^\circ$
  * Ground Reaction Force: $200\text{--}6000\,\text{N}$
* **Quality Score**: Computed per dataset, accessible via `GET /api/dataset/quality-report`.

---

## 15. Verification & Testing

An automated test suite validates endpoints, models, and services:

```bash
python -m unittest tests/test_system.py
```

### Verified Test Cases:
1. `test_01_system_status`: Verifies health check returns true for backend, database, movement model, and sensor model.
2. `test_02_athletes_and_sessions`: Tests athlete roster retrieval and individual profile endpoints.
3. `test_03_movement_prediction`: Verifies biomechanical model inference and risk category output (`LOW`/`MODERATE`/`HIGH`).
4. `test_04_sensor_prediction`: Validates wearable model inference and feature attribution output.
5. `test_05_self_assessment_and_nlp`: Submits subjective report and verifies NLP keyword and body region extraction.
6. `test_06_risk_fusion`: Validates 5-input multimodal fusion and contributing factor generation.
7. `test_07_dataset_quality_reports`: Confirms dataset registry audit executes without errors.
8. `test_08_recovery_analytics`: Validates AI-derived recovery indicator calculation.

---

## 16. Security, Privacy, and Ethical AI Standards

1. **Role-Based Access Control (RBAC)**: Enforced via cryptographic JWT tokens (`HS256`) distinguishing between `ADMIN`, `COACH`, `ATHLETE`, and `RESEARCHER` roles.
2. **Data Minimization & De-identification**: Medical imaging files strip DICOM and EXIF patient-identifying tags prior to disk storage.
3. **No Pose Estimation / No Camera Surveillance**: In accordance with user privacy guidelines, the system operates entirely without cameras or pose estimation algorithms.
4. **Transparent Explainability**: Every risk score displays its contributing factors, ensuring coaches and athletes understand the drivers behind recommendations.
5. **Clear Non-Diagnostic Scope**: Prominent disclaimers on every UI page and API report reinforce that this platform serves as an operational decision-support tool, not a clinical diagnostic device.
