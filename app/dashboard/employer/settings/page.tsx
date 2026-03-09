"use client";


import React, { useState } from "react";
import {
  Settings, Bell, Shield, Globe,
  Lock, Eye, EyeOff,
  Save, RefreshCw, Upload,
  CreditCard, Building,
  Key,
} from "lucide-react";
import EmployerLayout from "@/components/dashboard/employer/EmployerLayout";
import { Card } from "@/components/dashboard/Dashboardwidgets";
import ThemeToggle from "@/components/Themetoggle";

const COLORS = {
  navy: "#0f172a",
  white: "#ffffff",
  blue: "#2563eb",
  teal: "#0d9488",
  low: "#22c55e",
  moderate: "#f97316",
  high: "#ef4444",
  border: "#e2e8f0",
  muted: "#64748b",
  subtle: "#94a3b8",
  hover: "#f8fafc",
};

// ─── SETTINGS SECTION ─────────────────────────────────────────────────────
function SettingsSection({ 
  title, 
  description, 
  icon: Icon,
  children,
}: { 
  title: string; 
  description?: string; 
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 44,
          height: 44,
          background: `${COLORS.blue}10`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={20} color={COLORS.blue} />
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 800, color: COLORS.navy, margin: 0 }}>
            {title}
          </p>
          {description && (
            <p style={{ fontSize: 12, color: COLORS.muted, margin: "4px 0 0" }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {children}
    </Card>
  );
}

// ─── SETTING ROW ──────────────────────────────────────────────────────────
function SettingRow({ 
  label, 
  children,
  border = true,
}: { 
  label: string; 
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 0",
      borderBottom: border ? `1px solid ${COLORS.border}` : "none",
    }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: COLORS.navy, margin: 0 }}>
        {label}
      </p>
      <div style={{ minWidth: 200, display: "flex", justifyContent: "flex-end" }}>
        {children}
      </div>
    </div>
  );
}

// ─── TOGGLE SWITCH ────────────────────────────────────────────────────────
function ToggleSwitch({ 
  enabled, 
  onChange,
  label,
}: { 
  enabled: boolean; 
  onChange: () => void;
  label?: string;
}) {
  return (
    <button
      onClick={onChange}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      {label && <span style={{ fontSize: 12, color: COLORS.muted }}>{label}</span>}
      <div style={{
        width: 44,
        height: 24,
        background: enabled ? COLORS.blue : COLORS.border,
        position: "relative",
        transition: "background 0.2s",
      }}>
        <div style={{
          width: 20,
          height: 20,
          background: "#fff",
          position: "absolute",
          top: 2,
          left: enabled ? 22 : 2,
          transition: "left 0.2s",
        }} />
      </div>
    </button>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────
export default function EmployerSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [showApiKey, setShowApiKey] = useState(false);
  
  return (
    <EmployerLayout>
      <div style={{ paddingBottom: 48 }}>
        
        {/* Page Header */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 28,
        }}>
          <div>
            <p style={{
              margin: 0,
              marginBottom: 5,
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: COLORS.blue,
            }}>
              Configuration
            </p>
            <h1 style={{
              margin: 0,
              fontSize: "clamp(1.4rem, 3vw, 1.75rem)",
              fontWeight: 900,
              color: COLORS.navy,
              letterSpacing: "-0.025em",
              lineHeight: 1.15,
            }}>
              Settings
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: COLORS.muted }}>
              Manage your employer portal preferences and configurations
            </p>
          </div>

          <button style={{
            padding: "10px 24px",
            background: COLORS.blue,
            border: "none",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <Save size={16} />
            Save Changes
          </button>
        </div>

        {/* Settings Tabs */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          marginBottom: 24,
          borderBottom: `1px solid ${COLORS.border}`,
        }}>
          {[
            { id: "general", label: "General", icon: Settings },
            { id: "company", label: "Company", icon: Building },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "security", label: "Security", icon: Shield },
            { id: "billing", label: "Billing", icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 20px",
                  fontSize: 12,
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab.id ? `2px solid ${COLORS.blue}` : "none",
                  color: activeTab === tab.id ? COLORS.blue : COLORS.muted,
                  cursor: "pointer",
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* General Settings */}
        {activeTab === "general" && (
          <div style={{ display: "grid", gap: 20 }}>
            <SettingsSection 
              title="Company Information" 
              description="Update your company details and preferences"
              icon={Building}
            >
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    value="HMEX Global"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: 13,
                      border: `1px solid ${COLORS.border}`,
                      background: COLORS.white,
                      color: COLORS.navy,
                    }}
                  />
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>
                      Industry
                    </label>
                    <select style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: 13,
                      border: `1px solid ${COLORS.border}`,
                      background: COLORS.white,
                      color: COLORS.navy,
                    }}>
                      <option>Healthcare</option>
                      <option>Technology</option>
                      <option>Finance</option>
                      <option>Manufacturing</option>
                      <option>Retail</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>
                      Employee Count
                    </label>
                    <input
                      type="number"
                      value="2482"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        fontSize: 13,
                        border: `1px solid ${COLORS.border}`,
                        background: COLORS.white,
                        color: COLORS.navy,
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>
                    Company Logo
                  </label>
                  <div style={{
                    padding: 20,
                    border: `1px dashed ${COLORS.border}`,
                    background: `${COLORS.blue}02`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 8,
                  }}>
                    <Upload size={20} color={COLORS.muted} />
                    <p style={{ fontSize: 12, color: COLORS.muted, margin: 0 }}>
                      Drag and drop or <span style={{ color: COLORS.blue }}>browse</span>
                    </p>
                    <p style={{ fontSize: 10, color: COLORS.subtle, margin: 0 }}>
                      PNG, JPG up to 2MB
                    </p>
                  </div>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection 
              title="Regional Settings" 
              description="Configure your location and preferences"
              icon={Globe}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>
                    Time Zone
                  </label>
                  <select style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 13,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.white,
                    color: COLORS.navy,
                  }}>
                    <option>Eastern Time (UTC-5)</option>
                    <option>Central Time (UTC-6)</option>
                    <option>Mountain Time (UTC-7)</option>
                    <option>Pacific Time (UTC-8)</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>
                    Date Format
                  </label>
                  <select style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 13,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.white,
                    color: COLORS.navy,
                  }}>
                    <option>MM/DD/YYYY</option>
                    <option>DD/MM/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection 
              title="Data Preferences" 
              description="Configure how your data is handled"
              icon={Lock}
            >
              <SettingRow label="Data Retention Period">
                <select style={{
                  padding: "8px 12px",
                  fontSize: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: COLORS.white,
                  color: COLORS.navy,
                }}>
                  <option>7 years (HIPAA compliant)</option>
                  <option>5 years</option>
                  <option>3 years</option>
                  <option>1 year</option>
                </select>
              </SettingRow>
              
              <SettingRow label="Auto-anonymize data">
                <ToggleSwitch enabled={true} onChange={() => {}} />
              </SettingRow>
              
              <SettingRow label="Include in benchmark reports">
                <ToggleSwitch enabled={false} onChange={() => {}} />
              </SettingRow>
            </SettingsSection>
          </div>
        )}

        {/* Security Settings */}
        {activeTab === "security" && (
          <div style={{ display: "grid", gap: 20 }}>
            <SettingsSection 
              title="Password & Authentication" 
              description="Update your security preferences"
              icon={Lock}
            >
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: 13,
                      border: `1px solid ${COLORS.border}`,
                      background: COLORS.white,
                      color: COLORS.navy,
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: 13,
                      border: `1px solid ${COLORS.border}`,
                      background: COLORS.white,
                      color: COLORS.navy,
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ fontSize: 12, color: COLORS.muted, display: "block", marginBottom: 4 }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      fontSize: 13,
                      border: `1px solid ${COLORS.border}`,
                      background: COLORS.white,
                      color: COLORS.navy,
                    }}
                  />
                </div>
                
                <button style={{
                  padding: "10px 16px",
                  background: COLORS.blue,
                  border: "none",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                }}>
                  Update Password
                </button>
              </div>
            </SettingsSection>

            <SettingsSection 
              title="Two-Factor Authentication" 
              description="Add an extra layer of security to your account"
              icon={Shield}
            >
              <SettingRow label="Enable 2FA">
                <ToggleSwitch enabled={false} onChange={() => {}} />
              </SettingRow>
              
              <SettingRow label="Recovery email" border={false}>
                <input
                  type="email"
                  value="admin@hmex.com"
                  style={{
                    padding: "8px 12px",
                    fontSize: 12,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.white,
                    color: COLORS.navy,
                    width: 250,
                  }}
                />
              </SettingRow>
            </SettingsSection>

            <SettingsSection 
              title="API Access" 
              description="Manage API keys and integrations"
              icon={Key}
            >
              <SettingRow label="API Key">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <code style={{
                    padding: "8px 12px",
                    background: COLORS.hover,
                    border: `1px solid ${COLORS.border}`,
                    fontSize: 12,
                    fontFamily: "monospace",
                    color: COLORS.navy,
                  }}>
                    {showApiKey ? "hmx_live_8f7a3b2c1d9e4f5a6b7c8d9e0f1a2b3c" : "••••••••••••••••••••••••••••••••"}
                  </code>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{
                      padding: "8px",
                      background: "transparent",
                      border: `1px solid ${COLORS.border}`,
                      cursor: "pointer",
                    }}
                  >
                    {showApiKey ? <EyeOff size={14} color={COLORS.muted} /> : <Eye size={14} color={COLORS.muted} />}
                  </button>
                  <button style={{
                    padding: "8px",
                    background: "transparent",
                    border: `1px solid ${COLORS.border}`,
                    cursor: "pointer",
                  }}>
                    <RefreshCw size={14} color={COLORS.muted} />
                  </button>
                </div>
              </SettingRow>
              
              <SettingRow label="IP Whitelist" border={false}>
                <input
                  type="text"
                  value="192.168.1.1, 10.0.0.1"
                  style={{
                    padding: "8px 12px",
                    fontSize: 12,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.white,
                    color: COLORS.navy,
                    width: 250,
                  }}
                />
              </SettingRow>
            </SettingsSection>
          </div>
        )}

        <ThemeToggle />
      </div>
    </EmployerLayout>
  );
}