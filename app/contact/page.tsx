"use client";

import Image from "next/image";
import { MapPin, Mail, Phone } from "lucide-react";
import Navbar from "@/components/landingPage/navbar";
import Footer from "@/components/ui/Footer";
import { useState } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Add your form submission logic here
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative h-[60vh] lg:h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/assets/new/hero.png"
            alt="Healthcare professional"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-slate-700/70"></div>
        </div>
        
        {/* Hero Content */}
        <div className="relative z-10 text-center px-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in-up">
            Contact Us
          </h1>
          <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
            We&apos;re here to help and answer any questions you might have
          </p>
        </div>
      </section>

      {/* Contact Section - Pulled up to overlap hero */}
      <section className="relative -mt-32 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Left Side - Get in touch */}
                <div className="p-8 sm:p-12 bg-linear-to-br from-teal-50 to-white">
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#1a5f7a] mb-6">
                    Get in touch
                  </h2>
                  <p className="text-gray-600 mb-12 text-base sm:text-lg">
                    Have a question, need support, or want to partner with us?
                    We are here to Help!
                  </p>

                  <div className="space-y-8">
                    {/* Head Office - Location */}
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#1a5f7a] mb-1">
                          Head Office
                        </h3>
                        <p className="text-gray-600 text-sm sm:text-base"> Norrsken House Kigali 1 KN 78 St, Kigali</p>
                      </div>
                    </div>

                    {/* Head Office - Email */}
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#1a5f7a] mb-1">
                          Email Us
                        </h3>
                        <p className="text-gray-600 text-sm sm:text-base">info@healthmasterco.com</p>
                      </div>
                    </div>

                    {/* Call Us */}
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                        <Phone className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-[#1a5f7a] mb-1">
                          Call Us
                        </h3>
                        <p className="text-gray-600 text-sm sm:text-base">Phone:  +250789399765</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - Send us a message */}
                <div className="p-8 sm:p-12 bg-gray-50">
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#1a5f7a] mb-8">
                    Send us a message
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name Field */}
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                        required
                      />
                    </div>

                    {/* Email and Phone Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Phone
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* Message Field */}
                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none resize-none"
                        required
                      ></textarea>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Send
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="h-125 w-full">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63844.37502276254!2d30.058669799999998!3d-1.9440727!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x19dca4258ed8e797%3A0x4a6c9b4e2b0a5b0a!2sKigali%2C%20Rwanda!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="grayscale-0"
        ></iframe>
      </section>

      <Footer />
    </div>
  );
}
