"use client";

import { Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <main className="w-full bg-white">
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/assets/call-center.webp')",
          }}
        />

        <div className="absolute inset-0 bg-linear-to-br from-emerald-600/60 via-white/40 to-blue-900/60" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 max-w-2xl">
            Let’s Talk About Your{" "}
            <span className="text-emerald-600">Health Journey</span>
          </h1>

          <p className="mt-6 text-lg text-gray-700 max-w-xl">
            Have questions about health risk assessment, partnerships, or using
            HMEX? Our team is here to help you.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* LEFT */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Get in Touch
            </h2>

            <p className="text-gray-600 mb-10">
              Reach out to us anytime. We typically respond within 24 hours.
            </p>

            <div className="space-y-6">
              <ContactInfo
                icon={<Mail className="w-6 h-6" />}
                title="Email"
                value="support@hmex.health"
              />
              <ContactInfo
                icon={<Phone className="w-6 h-6" />}
                title="Phone"
                value="+250 7XX XXX XXX"
              />
              <ContactInfo
                icon={<MapPin className="w-6 h-6" />}
                title="Location"
                value="Kigali, Rwanda"
              />
            </div>
          </div>

          {/* FORM */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              Send Us a Message
            </h3>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="First Name" placeholder="John" />
                <Input label="Last Name" placeholder="Doe" />
              </div>

              <Input label="Email Address" placeholder="you@example.com" />
              <Input label="Subject" placeholder="How can we help?" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  rows={5}
                  placeholder="Write your message here..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition"
              >
                Send Message
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactInfo({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-gray-600">{value}</p>
      </div>
    </div>
  );
}

function Input({
  label,
  placeholder,
}: {
  label: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
    </div>
  );
}
