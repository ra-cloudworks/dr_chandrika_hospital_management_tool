import re
from difflib import SequenceMatcher
from patients.models import Patient
from .models import DuplicateFlag


def normalize(text: str) -> str:
    """Lowercase, strip punctuation/extra spaces — makes fuzzy matching more reliable."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    text = re.sub(r"\s+", " ", text)
    return text


def similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, normalize(a), normalize(b)).ratio()


def find_duplicates_for(patient: Patient):
    candidates = Patient.objects.exclude(id=patient.id).exclude(status="merged")

    for other in candidates:
        matched_fields = {}
        score = 0.0

        full_a = f"{patient.first_name} {patient.last_name}"
        full_b = f"{other.first_name} {other.last_name}"
        name_score = similarity(full_a, full_b)

        dob_match = bool(patient.dob and other.dob and patient.dob == other.dob)

        # Baseline signal: name + DOB — this must be reasonably strong before we even consider it
        if dob_match and name_score > 0.75:
            matched_fields["dob"] = True
            matched_fields["name_similarity"] = round(name_score, 2)
            score += 60 + (name_score * 20)  # up to 80

            # Address acts as a confidence booster, not a separate gate
            if patient.address and other.address:
                addr_score = similarity(patient.address, other.address)
                if addr_score > 0.6:
                    matched_fields["address_similarity"] = round(addr_score, 2)
                    score += addr_score * 15  # up to +15, pushing strong matches near 95-100

            # Phone match (if present) further corroborates, even though it's no longer unique
            if patient.phone and other.phone and patient.phone == other.phone:
                matched_fields["phone"] = True
                score += 5

        if score >= 60 and matched_fields:
            pair = sorted([patient.id, other.id])
            score = min(round(score, 2), 100.0)
            DuplicateFlag.objects.update_or_create(
                patient_a_id=pair[0],
                patient_b_id=pair[1],
                defaults={"match_score": score, "matched_fields": matched_fields},
            )

def scan_all_patients() -> int:
    """Re-scan every active patient for duplicates. Returns count of patients scanned."""
    from patients.models import Patient

    patients = Patient.objects.exclude(status="merged")
    for patient in patients:
        find_duplicates_for(patient)
    return patients.count()