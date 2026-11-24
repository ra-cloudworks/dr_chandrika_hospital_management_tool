from django.urls import path
from .views import (
    DentalLabListCreateView,
    DentalLabDetailView,
    LabOrderListCreateView,
    LabOrderGlobalListView,
    LabOrderDetailView,
    LabOrderStatusUpdateView,
    LabOrdersByLabView,
    OverdueLabOrdersView,
)

urlpatterns = [
    # External Dental Labs endpoints
    path("labs/", DentalLabListCreateView.as_view(), name="dental-lab-list-create"),
    path("labs/<int:pk>/", DentalLabDetailView.as_view(), name="dental-lab-detail"),

    # Global lab orders endpoint for dashboard
    path("all/", LabOrderGlobalListView.as_view(), name="lab-order-global-list"),

    # Patient-scoped lab orders endpoint
    path("<int:patient_id>/", LabOrderListCreateView.as_view(), name="lab-order-list-create"),

    # Individual lab order detail & status update endpoints
    path("order/<int:pk>/", LabOrderDetailView.as_view(), name="lab-order-detail"),
    path("order/<int:pk>/status/", LabOrderStatusUpdateView.as_view(), name="lab-order-status-update"),

    # Special query views: by lab and overdue orders
    path("by-lab/<int:lab_id>/", LabOrdersByLabView.as_view(), name="lab-orders-by-lab"),
    path("overdue/", OverdueLabOrdersView.as_view(), name="overdue-lab-orders"),
]
