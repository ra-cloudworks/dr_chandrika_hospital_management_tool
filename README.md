# Dr. Chandrika Hospital & Dental Management System

<!-- 
  Dr. Chandrika Hospital Management Tool - Comprehensive System Documentation
  This document provides a detailed overview of the application architecture, implemented modules, 
  clinical features, and setup instructions for developers, administrators, and healthcare professionals.
-->

A modern, full-stack Electronic Health Record (EHR) and clinical workflow management application tailored specifically for dental and general healthcare practices. Built to streamline patient care, digitize clinical diagnostic charting, automate duplicate patient record detection, and enforce strict role-based authorization across clinical staff.

---

## Table of Contents
1. [Project Overview & Purpose](#-project-overview--purpose)
2. [Key Features Implemented Till Now](#-key-features-implemented-till-now)
3. [Implemented Modules & Why They Are Included](#-implemented-modules--why-they-are-included)
   - [1. User Authentication & Staff Management (`accounts`)](#1-user-authentication--staff-management-accounts)
   - [2. Patient Identity & Medical History (`patients`)](#2-patient-identity--medical-history-patients)
   - [3. Patient Duplicate Detection & Queue (`duplicates`)](#3-patient-duplicate-detection--queue-duplicates)
   - [4. Clinical Vitals Tracking (`vitals`)](#4-clinical-vitals-tracking-vitals)
   - [5. Interactive Dental Chart / Odontogram (`dental_chart`)](#5-interactive-dental-chart--odontogram-dental_chart)
   - [6. Periodontal Charting & Gum Health (`perio_chart`)](#6-periodontal-charting--gum-health-perio_chart)
   - [7. Treatment Planning & Consent (`treatment_plans`)](#7-treatment-planning--consent-treatment_plans)
   - [8. Clinical Case Files (`case_files`)](#8-clinical-case-files-case_files)
   - [9. Case Media & File Management (`case_media`)](#9-case-media--file-management-case_media)
4. [Technology Stack](#-technology-stack)
5. [System Architecture & Data Flow](#-system-architecture--data-flow)
6. [Getting Started & Installation](#-getting-started--installation)
7. [Device Responsiveness & Standards](#-device-responsiveness--standards)

---

## Project Overview & Purpose

Healthcare practices—especially combined dental and general outpatient clinics—face unique operational challenges:
* Traditional paper clipboard charts for dental and gum measurements are easy to lose, hard to query, and obscure long-term clinical trends.
* Multiple registrations of the same patient lead to split medical histories, missing allergy alerts, and billing inaccuracies.
* General patient triage (vitals, systemic history) must seamlessly connect with dental procedure planning (root canals, implants, periodontal therapy).

**Dr. Chandrika Hospital Management Tool** addresses these challenges by offering a centralized, digitized, highly intuitive web application. It empowers doctors, hygienists, assistants, receptionists, and accountants with specialized clinical tools, automated safeguards, and responsive dashboards accessible on desktop, tablet, and mobile interfaces.

---

## Key Features Implemented Till Now

* **Secure Role-Based Access Control (RBAC):** Customized permissions for Chief Doctor, Doctor, Assistant, Receptionist, Accountant, and Patient roles.
* **Multi-Factor Auth & Audit Logging:** Supports OTP verification and tracks user login histories alongside system audit trails.
* **Automated Patient Code Generation:** Unique sequential patient identifiers (e.g., `PT00001`) with ABHA ID integration support.
* **Smart Duplicate Detection Queue:** Automated background fuzzy matching for patient records based on phone numbers, names, and date of birth, complete with a side-by-side comparison and field-by-field merge tool.
* **Multi-Context Vitals Monitoring:** Real-time baseline vitals tracking (BP, Pulse, Blood Sugar, SpO2, Temperature, BMI) with automatic visual flagging for out-of-range clinical parameters.
* **Interactive Visual Odontogram (Dental Chart):** Complete FDI notation tooth map supporting permanent adult (11–48) and primary milk teeth (51–85), surface-level diagnosis (Mesial, Distal, Occlusal, Buccal, Lingual, Incisal, Whole), color-coded treatment statuses, and detailed procedure logs.
* **Specialized Dental Sub-Form Tracking:** Deep-dive record management for Endodontics (RCT working lengths/canals), Implants (brand, serial numbers, bone grafts, warranties), and Orthodontics (bracket types, wire sizes).
* **6-Point Periodontal Examination Chart:** Site-specific pocket depth (mm), gingival recession (mm), clinical attachment loss (CAL), bleeding on probing (BOP), suppuration, mobility grades, and furcation involvement per tooth.
* **Treatment Planning & Patient Consent:** Itemized multi-phase procedure planning (Urgent, Preventive, Restorative, Cosmetic), cost estimation breakdown, plan proposal locking, digital patient consent sign-off (accept/reject with timestamp and signature), and immutable revision version logging.
* **Comparative Clinical History:** Immutable event logging per tooth and historical periodontal examination visual comparisons.
* **Problem-Oriented Case Files:** End-to-end clinical problem tracking grouping visit notes, patient complaints, clinical findings, interventions, batch-tracked materials for traceability, and multi-visit timelines under issue-specific folders.
* **Digital Case Media & File Management:** Storage, retrieval, and browser rendering of X-rays, clinical photos, and consent documents with automatic patient/case linking, version retention on re-upload, and audit-logged removal restricted to Chief Doctors.

---

## Implemented Modules & Why They Are Included

### 1. User Authentication & Staff Management (`accounts`)
* **What it does:** Handles user accounts, JWT token authentication, login history logs, OTP verification, user profile updates, and role-based authorization.
* **Roles Supported:** `Chief Doctor`, `Doctor`, `Assistant`, `Receptionist`, `Accountant`, `Patient`.
* **Why included:** Ensures strict patient data privacy (HIPAA alignment), prevents unauthorized access to clinical actions, and maintains full accountability for staff actions.

### 2. Patient Identity & Medical History (`patients`)
* **What it does:** Stores comprehensive patient profiles, auto-generated registration codes (`PT00001`), demographics, emergency contact details, guardian details (for pediatric patients), chronic medical conditions, allergy logs (with mild/moderate/severe severity badges), and family links.
* **Why included:** Serves as the single source of truth for patient identity. Highlighting medical conditions and severe allergies prominently on patient charts prevents adverse drug events or surgical complications.

### 3. Patient Duplicate Detection & Queue (`duplicates`)
* **What it does:** Computes similarity match scores across incoming/existing patient records. Flagged duplicates appear in a dedicated queue where staff can review side-by-side differences, resolve field conflicts, merge duplicate profiles into a primary record, or dismiss false positives. Includes reversible merge logging.
* **Why included:** In busy clinics, receptionists frequently create duplicate profiles for returning patients who change phone numbers or spell names slightly differently. Merging prevents fragmented medical records and lost treatment histories.

### 4. Clinical Vitals Tracking (`vitals`)
* **What it does:** Records vital signs under specific clinical contexts: *Registration*, *Pre-Treatment*, *Intra-Procedure*, and *Post-Treatment*. Measures Blood Pressure (Systolic/Diastolic), Pulse Rate, Blood Sugar (mg/dL), Temperature (°F), SpO2 (%), Weight (kg), and Height (cm) with automatic BMI calculations.
* **Automated Safeguard:** Automatically flags abnormal readings (e.g., BP ≥ 140/90 or SpO2 < 95%) and alerts the clinical team prior to procedure initiation.
* **Why included:** Dental procedures often involve local anesthetics with vasoconstrictors (epinephrine), which are contraindicated in patients with severe hypertension or unmanaged blood sugar. Pre-procedure vitals are essential for patient safety.

### 5. Interactive Dental Chart / Odontogram (`dental_chart`)
* **What it does:** Provides a digital FDI 2-digit diagram of 32 permanent teeth and 20 primary milk teeth. Clinicians select tooth surfaces and record conditions (Decay, Filling, Crown, Bridge, Implant, Root Canal / RCT, Missing, Impacted, Unerupted, Supernumerary, Fracture, Mobility, Sensitivity, Healthy).
* **Status Color-Coding System:**
  * **Gray (Existing):** Pre-existing condition/work done elsewhere.
  * **Amber (Planned):** Treatment planned for future visits.
  * **Green (Completed):** Procedure completed in this clinic.
  * **Red (Declined):** Treatment recommended but rejected by patient.
* **Specialized Modals:**
  * *Endodontic Form:* Working length (mm), canal count, obturation date, and notes.
  * *Implant Form:* Brand, diameter, length, batch/serial number, placement date, bone graft material, warranty period.
  * *Orthodontic Form:* Appliance type, bracket type, wire size, adjustment dates.
* **Tooth History Timeline:** Keeps an audit trail of every change ever made to a tooth over time.
* **Why included:** Replaces paper clipboard diagrams with interactive data. Six months or two years later, dentists can click any tooth to instantly view its exact procedure history without digging through physical files.

### 6. Periodontal Charting & Gum Health (`perio_chart`)
* **What it does:** Digitizes full-mouth periodontal health assessments by recording probe measurements at **6 distinct sites per tooth**:
  * *Buccal Aspect:* Mesiobuccal (MB), Buccal (B), Distobuccal (DB)
  * *Lingual Aspect:* Mesiolingual (ML), Lingual (L), Distolingual (DL)
* **Parameters Recorded:** Pocket Depth (mm), Recession (mm), Bleeding on Probing (BOP), Suppuration, Tooth Mobility Grade (0–3), Furcation Grade (0–3), Plaque, and Calculus presence.
* **Exam History Comparison:** Allows clinicians to view past perio exams side-by-side to evaluate treatment response (e.g., scaling & root planing).
* **Why included:** Gum disease (periodontitis) is measured by pocket depth increases over time. Manual 32-tooth × 6-site paper charts (192 numbers per exam) are prone to transcription error. This module provides quick data entry and progression analysis.

### 7. Treatment Planning & Consent (`treatment_plans`)
* **What it does:** Allows clinicians to compile findings from the Dental and Perio charts into structured treatment plans. Each plan contains itemized procedures (e.g., "Tooth 36 Root Canal + Crown"), clinical phases (*Urgent*, *Preventive*, *Restorative*, *Cosmetic*), estimated duration, and detailed pricing (base price, material cost, lab charges, discounts, taxes).
* **Workflow & Status Progression:**
  1. **Draft:** Plan construction and procedure editing by doctors.
  2. **Proposed:** Plan locked and presented to patient with financial estimates.
  3. **Patient Decision:** Dedicated endpoint allowing the patient to Accept or Reject the plan with signature capture and timestamping.
  4. **Revision Audit Logging:** If treatment needs change mid-way, doctors must provide a mandatory reason. The system creates a full snapshot in `TreatmentPlanRevisionLog`, increments the revision number (v1, v2...), and resets to draft for new consent.
* **Why included:** Protects both patient and practice. Patients receive clear cost transparency and procedure expectations before treatment starts. Clinicians maintain an immutable paper trail of agreed plans and revisions, ensuring legal compliance and preventing financial disputes.

<!-- Module 8: Clinical Case Files Documentation -->
### 8. Clinical Case Files (`case_files`)
* **What it does:** Organizes patient clinical records into problem-oriented case folders (e.g., *"Root Canal – Tooth 36"*), capturing the overall story of a specific clinical problem from start to finish. Each case file serves as a master container grouping every visit note tied to that specific issue:
  * **Patient Complaints & Doctor Findings:** Records what the patient reported and clinical diagnostic observations.
  * **Interventions & Procedures:** Documents exact steps taken during each visit under the case timeline.
  * **Material Traceability:** Logs dental materials used along with **batch numbers** to ensure full traceability in case of material defects or failure.
  * **Case Closure & Outcomes:** Records resolution status and post-procedure summary once treatment concludes.
  * **Multiple Concurrent Cases:** Patients can have several active case folders simultaneously (e.g., an ongoing orthodontic alignment, a completed filling, and an emergency triage visit), with each case retaining its own independent, ordered timeline of visits underneath it.
* **Why included:** Every other clinical module captures isolated data types (vitals, teeth condition, gum measurements, treatment plans). The Case File module ties these scattered records together into a cohesive, chronological story. When a doctor opens a patient's chart, they can immediately view the entire trajectory of a specific problem without manually piecing together individual visit logs.

<!-- Module 9: Case Media & File Management Documentation -->
### 9. Case Media & File Management (`case_media`)
* **What it does:** Provides digital storage and management for actual binary files, acting as the digital counterpart to a physical clinic document folder:
  * **Supported Media Types:** Diagnostic X-ray images, clinical photographs (before/after shots, intraoral photos), and digital documents (signed consent forms, referral letters, lab reports).
  * **Automatic Case & Tooth Linking:** Uploaded media files are automatically indexed and searchable by patient ID, case file, or specific tooth number.
  * **Version Retention Safeguard:** Re-uploading a clearer X-ray or updated document does not overwrite or destroy the existing file. The system retains older uploads as "previous versions" for historical audit trails.
  * **Permanent Deletion Protection:** Files cannot be permanently erased from the system by standard users. Only a **Chief Doctor** can mark a file as removed, requiring a mandatory reason that is logged in the system audit trail.
* **Key Technical Implementations:**
  * **Multipart File Uploads:** Supports binary multi-part form data uploads handling actual media files beyond traditional JSON API payloads.
  * **Browser Media Serving:** Implements media file serving endpoints and proper headers enabling inline browser viewing of X-rays, photos, and document previews.
* **Why included:** Eliminates paper file clutter while safeguarding sensitive diagnostic media. Automated linking ensures quick access during procedures, while versioning and restricted deletion protect the practice against accidental data loss or legal non-compliance.

---

## Technology Stack

| Layer | Technology Used | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript | Component-based UI with strong static typing |
| **Build Tool & Bundler** | Vite 8 | Ultra-fast local development server and HMR |
| **Routing** | React Router v7 | Nested routes & role-protected route guards |
| **Styling** | Vanilla CSS + TailwindCSS 3 | Responsive grid/flex layouts, customized themes |
| **HTTP Client** | Axios | REST API communication with JWT interceptors |
| **Backend Framework** | Django 6.0 + Python 3.12 | Scalable web framework with custom ORM models |
| **REST API** | Django REST Framework (DRF) | Serializers, ViewSets, and API endpoints |
| **Authentication** | SimpleJWT | Stateless JSON Web Token authentication |
| **Database** | PostgreSQL / SQLite | Relational database management with transactional integrity |

---

## System Architecture & Data Flow

```
+-----------------------------------------------------------------------+
|                             REACT FRONTEND                            |
|  [Staff / Doctors / Receptionists / Assistants / Accountants]         |
|                                                                       |
|  +-------------------+  +-------------------+  +-------------------+  |
|  | Patient Directory |  | Duplicate Queue   |  | Clinical Vitals   |  |
|  +-------------------+  +-------------------+  +-------------------+  |
|  | Dental Odontogram |  | Periodontal Chart |  | Treatment Plans   |  |
|  +-------------------+  +-------------------+  +-------------------+  |
|  | Case Files        |  | Case Media        |                         |
|  +-------------------+  +-------------------+                         |
+-----------------------------------||----------------------------------+
                                    || HTTP REST / Multipart / JWT
+-----------------------------------\/----------------------------------+
|                            DJANGO BACKEND API                         |
|                                                                       |
|   /api/auth/           -> User Authentication & Role Permissions       |
|   /api/patients/       -> Patient Profiles, History, Allergies        |
|   /api/duplicates/     -> Match Score Engine & Merge Queue            |
|   /api/vitals/         -> Vitals Recording & Out-of-Range Flags        |
|   /api/dental-chart/   -> Tooth Records, FDI Mapping, Surface Details |
|   /api/perio-chart/    -> 6-Site Probe Depth, BOP, Mobility & Exams   |
|   /api/treatment-plans/-> Plan Building, Pricing, Consent & Revisions   |
|   /api/case-files/     -> Problem Folders, Visit Timelines & Batches  |
|   /api/case-media/     -> File Uploads, Media Serving & Versioning    |
+-----------------------------------||----------------------------------+
                                    || ORM Queries / Media Storage
+-----------------------------------\/----------------------------------+
|                           RELATIONAL DATABASE & MEDIA                 |
|               [PostgreSQL / SQLite Database & File Storage]           |
+-----------------------------------------------------------------------+
```

---

## Getting Started & Installation

### Prerequisites
* **Node.js** (v18+ recommended)
* **Python** (v3.10+ recommended)
* **PostgreSQL** or **SQLite**

### Backend Setup (Django)
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install django djangorestframework djangorestframework-simplejwt django-cors-headers
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Start the development server:
   ```bash
   python manage.py runserver
   ```
   The backend API will run at `http://127.0.0.1:8000/`.

### Frontend Setup (React + Vite)
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The application UI will run at `http://localhost:5173/`.

---

## Device Responsiveness & Standards

* **Cross-Device Compatibility:** Designed and tested to be fluidly responsive across widescreen desktop workstations, iPads/tablets, and smartphone mobile browsers.
* **Accessibility & UI Clarity:** Employs intuitive color coding, high-contrast badges for clinical safety warnings, and high-density clinical data presentation without clutter.
* **Data Integrity:** Cascading deletes, unique pairing constraints on duplicates, and immutable historical change logs ensure patient data remains consistent and auditable.

---
*Maintained for Dr. Chandrika Hospital & Dental Clinic.*
