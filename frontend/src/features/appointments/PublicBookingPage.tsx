import { useState } from "react";
import { submitPublicRequest } from "../../api/appointmentApi";

export function PublicBookingPage() {
    // Form state for guest public appointment request
    const [guestName, setGuestName] = useState("");
    const [guestPhone, setGuestPhone] = useState("");
    const [guestEmail, setGuestEmail] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [reason, setReason] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Handles submitting appointment request with required guest email
    const handleSubmit = async () => {
        if (!guestName || !guestPhone || !guestEmail || !date || !time) {
            setError("Please fill in all mandatory fields: name, phone number, email address, date, and preferred time.");
            return;
        }
        // Validate email format
        if (!/\S+@\S+\.\S+/.test(guestEmail)) {
            setError("Please enter a valid email address.");
            return;
        }
        setError("");
        setLoading(true);
        try {
            await submitPublicRequest({
                guest_name: guestName,
                guest_phone: guestPhone,
                guest_email: guestEmail,
                appointment_date: date,
                start_time: time,
                reason_for_visit: reason,
            });
            setSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Could not submit appointment request. Please check your inputs.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="p-8 max-w-md mx-auto my-12 bg-white rounded-xl shadow border border-gray-100 text-center space-y-3">
                <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">✓</div>
                <h2 className="text-xl font-semibold text-gray-800">Appointment Request Received!</h2>
                <p className="text-sm text-gray-500">
                    Thank you, <span className="font-medium text-gray-700">{guestName}</span>. Our reception team will review your requested slot on <span className="font-medium text-gray-700">{date} at {time}</span> and send a confirmation to your email (<span className="font-medium text-gray-700">{guestEmail}</span>) shortly.
                </p>
                <button
                    onClick={() => setSubmitted(false)}
                    className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                    Book Another Request
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-4 sm:p-6 space-y-4 my-6 bg-white border rounded-xl shadow-sm">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Book an Appointment</h1>
                <p className="text-xs text-gray-500 mt-1">Select your preferred date and time. Our team will verify doctor availability and confirm your booking.</p>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs border border-red-100">{error}</div>}

            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                        placeholder="e.g. John Doe"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                        placeholder="e.g. +91 9876543210"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email Address *</label>
                    <input
                        type="email"
                        placeholder="e.g. patient@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Date *</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Time *</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Reason for Visit</label>
                    <textarea
                        rows={3}
                        placeholder="Describe your health concern or consultation reason..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:outline-none resize-none"
                    />
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-4 py-2.5 rounded-lg w-full text-sm transition-colors disabled:opacity-50"
                >
                    {loading ? "Submitting Request..." : "Request Appointment"}
                </button>
            </div>
        </div>
    );
}