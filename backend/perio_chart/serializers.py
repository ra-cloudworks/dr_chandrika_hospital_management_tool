from rest_framework import serializers
from .models import PerioExam, PerioToothMeasurement, PerioSiteReading


class PerioSiteReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = PerioSiteReading
        fields = ["id", "site", "pocket_depth_mm", "recession_mm", "bleeding_on_probing", "suppuration"]


class PerioToothMeasurementSerializer(serializers.ModelSerializer):
    site_readings = PerioSiteReadingSerializer(many=True)

    class Meta:
        model = PerioToothMeasurement
        fields = ["id", "tooth_number", "mobility_grade", "furcation_grade",
                  "plaque_present", "calculus_present", "site_readings"]


class PerioExamSerializer(serializers.ModelSerializer):
    tooth_measurements = PerioToothMeasurementSerializer(many=True)
    performed_by_name = serializers.CharField(source="performed_by.get_full_name", read_only=True)

    class Meta:
        model = PerioExam
        fields = ["id", "patient", "exam_date", "diagnosis_summary",
                  "performed_by_name", "created_at", "tooth_measurements"]
        read_only_fields = ["patient", "exam_date", "created_at"]

    def create(self, validated_data):
        teeth_data = validated_data.pop("tooth_measurements")
        exam = PerioExam.objects.create(**validated_data)

        for tooth_data in teeth_data:
            sites_data = tooth_data.pop("site_readings")
            tooth = PerioToothMeasurement.objects.create(exam=exam, **tooth_data)
            for site_data in sites_data:
                PerioSiteReading.objects.create(tooth_measurement=tooth, **site_data)

        return exam