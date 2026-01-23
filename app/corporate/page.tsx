"use client";

import Navbar from "@/components/landingpage/navbar";
import Footer from "@/components/ui/Footer";
import { Users, Briefcase, Calendar } from "lucide-react";
import { useState } from "react";

export default function CorporatePage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    organization: "",
    employeeCount: "",
    email: "",
    phone: "",
    preferredDate: "",
  });

  const handleSubmit = async () => {
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/corporate-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error();

      setStatus("success");
      setFormData({
        name: "",
        department: "",
        organization: "",
        employeeCount: "",
        email: "",
        phone: "",
        preferredDate: "",
      });
    } catch {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const employeeRanges = ["1-50", "51-200", "201-500", "501-1000", "1001+"];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Hero Section */}
      <section className="relative h-[65vh] flex items-center justify-center overflow-hidden bg-linear-to-br from-slate-800 via-slate-700 to-teal-900">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("/assets/coorporate.png")`,
            }}
          ></div>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-block mb-6"></div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Transform Your Organization&apos;s{" "}
            <span className="text-teal-300">Healthcare</span>
          </h1>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="relative -mt-24 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="grid lg:grid-cols-5 gap-0">
              {/* Left Sidebar - Benefits */}
              <div className="lg:col-span-2 p-8 sm:p-12 bg-linear-to-br from-teal-50 via-white to-teal-50/30 border-r border-teal-100">
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1a5f7a] mb-4">
                  Why Partner With Us?
                </h2>
                <p className="text-gray-600 mb-10 text-base leading-relaxed">
                  Discover how we can elevate your organization&apos;s
                  healthcare experience.
                </p>

                <div className="space-y-8">
                  <div className="group">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-14 h-14 bg-linear-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <Users className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#1a5f7a] mb-2">
                          Scalable Solutions
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Flexible plans designed to grow with your
                          organization, from startups to enterprises.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-14 h-14 bg-linear-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <Briefcase className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#1a5f7a] mb-2">
                          Dedicated Support
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Your success is our priority with personalized
                          onboarding and ongoing support.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-14 h-14 bg-linear-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                        <Calendar className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#1a5f7a] mb-2">
                          Quick Implementation
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Get your team up and running in days, not months, with
                          our streamlined process.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 p-6 bg-white rounded-2xl border border-teal-200 shadow-sm">
                  <p className="text-sm text-gray-600 italic leading-relaxed">
                    &ldquo;HealthMaster transformed how we deliver healthcare to
                    our 500+ employees. The platform is intuitive and our team
                    loves it.&rdquo;
                  </p>
                  <p className="mt-3 text-sm font-semibold text-[#1a5f7a]">
                    — Corporate Client
                  </p>
                </div>
              </div>

              {/* Right Side - Form */}
              <div className="lg:col-span-3 p-8 sm:p-12 bg-gray-50">
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1a5f7a] mb-3">
                  See How We Can Transform Employee Health and Wellness
                </h2>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Book a personalized demo and discover how our AI-powered
                  platform helps your workforce stay healthy, reduces risk, and
                  supports wellness programs
                </p>

                <div className="space-y-5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-3.5 text-black rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none bg-white"
                    />
                  </div>

                  {/* Department & Organization */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="department"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Department *
                      </label>
                      <input
                        type="text"
                        id="department"
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="Human Resources"
                        className="w-full px-4 text-black py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="organization"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Organization/Company *
                      </label>
                      <input
                        type="text"
                        id="organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        placeholder="Acme Corp"
                        className="w-full px-4 text-black py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Employee Count */}
                  <div>
                    <label
                      htmlFor="employeeCount"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Number of Employees *
                    </label>
                    <select
                      id="employeeCount"
                      name="employeeCount"
                      value={formData.employeeCount}
                      onChange={handleChange}
                      className="w-full px-4 text-black py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none bg-white appearance-none cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23374151' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 1rem center",
                      }}
                    >
                      <option value="">Select range</option>
                      {employeeRanges.map((range) => (
                        <option key={range} value={range}>
                          {range} employees
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@company.com"
                        className="w-full px-4 text-black py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+250 789 399 765"
                        className="w-full px-4 text-black py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Preferred Date */}
                  <div>
                    <label
                      htmlFor="preferredDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Preferred Demo Date
                    </label>
                    <input
                      type="date"
                      id="preferredDate"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleChange}
                      className="w-full px-4 text-black py-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none bg-white"
                    />
                  </div>

                  {status === "success" && (
                    <p className="text-green-600 text-sm">
                      ✅ Demo request sent. Our team will contact you shortly.
                    </p>
                  )}

                  {status === "error" && (
                    <p className="text-red-600 text-sm">
                      ❌ Something went wrong. Please try again.
                    </p>
                  )}

                  {/* Submit Button */}
                  <button
                    disabled={loading}
                    onClick={handleSubmit}
                    className="w-full bg-linear-to-r from-teal-500 to-teal-600 disabled:opacity-50 text-white font-semibold py-4 rounded-full"
                  >
                    {loading ? "Submitting..." : "Book A Demo"}
                  </button>

                  <p className="text-xs text-gray-500 text-center mt-4">
                    We&apos;ll get back to you within 24 hours to schedule your
                    personalized demo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 bg-linear-to-br from-slate-50 to-teal-50/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-[#1a5f7a] mb-2">500+</div>
              <div className="text-gray-600 text-sm">Organizations</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#1a5f7a] mb-2">50K+</div>
              <div className="text-gray-600 text-sm">Employees Served</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#1a5f7a] mb-2">98%</div>
              <div className="text-gray-600 text-sm">Satisfaction Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-[#1a5f7a] mb-2">24/7</div>
              <div className="text-gray-600 text-sm">Support Available</div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
