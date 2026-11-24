# Backend Setup Guide — Dr. Chandrika Dental Care

This document outlines the step-by-step instructions to set up, initialize, and run the Django REST Framework backend on any system.

---

## Prerequisites
- **Python:** v3.10+ (v3.12 recommended)
- **pip:** Latest version

---

## Setup Backend (in `backend/`)

Follow these steps when setting up the project on a new system or fresh clone:

### 1. Navigate to the backend directory
```bash
cd backend
```

### 2. Create a clean virtual environment
```bash
python -m venv venv
```

### 3. Activate the virtual environment
- **Windows (Command Prompt / PowerShell):**
  ```powershell
  .\venv\Scripts\activate
  ```
  *(If using PowerShell with script restrictions: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` then `.\venv\Scripts\Activate.ps1`)*

- **macOS / Linux:**
  ```bash
  source venv/bin/activate
  ```

### 4. Install all dependencies from `requirements.txt`
```bash
pip install -r requirements.txt
```

### 5. Apply database migrations
```bash
python manage.py migrate
```

### 6. Populate Complete Sample Data (Recommended for Testing & New Clones)
Run the custom seed command to automatically populate realistic test data across all 13 clinical and administrative modules:
```bash
python manage.py seed_sample_data --clear
```
> **Note:** This command is completely idempotent and safe to run whenever you clone or move the project to a new computer. It provisions demo patients, odontograms, perio charts, appointments, inventory, lab orders, invoices, and pre-configured test users.

#### Default Test Accounts (Password: `password123` for all)
- **Chief Doctor:** `chandrika` (Full access, billing governance, discount approvals, margins)
- **Doctor:** `dr_ramesh` (Clinical charts, treatment plans, visit notes, lab orders)
- **Receptionist:** `kavitha` (Patient registration, duplicate resolution, appointments, invoicing)
- **Accountant:** `suresh` (Payments, patient advances, revenue ledger)
- **Patient Portal:** `patient_rajesh` (Patient appointments, signed treatment plan, invoices)

### 7. Start the development server
```bash
python manage.py runserver
```

The Django REST Framework backend API will now be live at:
`http://127.0.0.1:8000/`

---

## Helpful Commands

### Run Unit Tests
To run tests for specific modules (e.g., Billing & Financial Governance):
```bash
python manage.py test billing
```

### Alternative Runner (Using taskipy)
If `taskipy` is installed and activated:
```bash
task dev
```