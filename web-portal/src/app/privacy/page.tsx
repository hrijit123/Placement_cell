import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow-sm border border-stone-200">
        <h1 className="text-3xl font-serif text-stone-900 mb-6">Privacy Policy</h1>
        
        <p className="text-stone-600 mb-6">
          At ISL Connect, accessibility and privacy are our top priorities. This policy outlines how we handle the biometric-adjacent data required for our real-time Indian Sign Language (ISL) translation services.
        </p>

        <h2 className="text-xl font-semibold text-stone-800 mt-8 mb-4">1. Data Collection & Processing</h2>
        <p className="text-stone-600 mb-4">
          During an ISL Interview, our application requires access to your camera to capture hand gestures. This processing happens in two stages:
        </p>
        <ul className="list-disc pl-6 text-stone-600 mb-6 space-y-2">
          <li><strong>Client-Side Detection:</strong> The MediaPipe AI runs entirely in your browser to extract 3D hand landmarks (x, y, and z coordinates). The raw video feed never leaves your device.</li>
          <li><strong>Server-Side Inference:</strong> Only the abstracted coordinate numbers are transmitted securely via WebSocket to our machine learning service for character prediction.</li>
        </ul>

        <h2 className="text-xl font-semibold text-stone-800 mt-8 mb-4">2. Data Retention & Transient Processing</h2>
        <p className="text-stone-600 mb-6">
          <strong>We do not store your video feed or your hand coordinate data.</strong> 
          <br /><br />
          The coordinate data sent to our servers is processed in memory (transiently) to generate a text prediction and is immediately discarded. We do not use your interview session data to retrain our models, nor is it persisted to any database.
        </p>

        <h2 className="text-xl font-semibold text-stone-800 mt-8 mb-4">3. Authentication & Account Data</h2>
        <p className="text-stone-600 mb-6">
          When you log in via Google OAuth, we store your email address, name, and chosen role (Candidate or Recruiter). This information is used strictly to provide you access to the platform (such as posting jobs or applying to them).
        </p>

        <h2 className="text-xl font-semibold text-stone-800 mt-8 mb-4">4. Your Rights</h2>
        <p className="text-stone-600 mb-6">
          You have the right to request the deletion of your account and any associated profile or job application data at any time. Because we do not store interview streams, there is no video or translation history to delete.
        </p>
      </div>
    </div>
  );
}
