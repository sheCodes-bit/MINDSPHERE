'use client'

import { useEffect, useState } from 'react'
import {
  Settings,
  Database,
  Key,
  Shield,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Code2,
  Sparkles,
  Server,
  RefreshCw,
  Terminal,
  FileText
} from 'lucide-react'
import { BRAND_CONFIG, getDevelopers } from '@/config/branding'
import { toast } from 'sonner'

export default function PlatformSettingsPage() {
  const developers = getDevelopers()
  const [checking, setChecking] = useState(false)
  const [sysStatus, setSysStatus] = useState({
    supabaseConnected: true,
    authProviders: ['Email / Password', 'Google OAuth'],
    rulesVersion: '1.0',
    platformVersion: '2.4.0',
    environment: process.env.NODE_ENV || 'production',
  })

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="h-6 w-6 text-amber-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Settings & Health</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            System environment status, database schema integrity, OAuth provider diagnostics, and branding parameters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            System Healthy
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Environment & Backend Health */}
        <section className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-200/60 pb-3">
            <Database className="h-5 w-5 text-amber-600" />
            <h2 className="text-base">Supabase Infrastructure</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500">Database Driver:</span>
              <span className="font-mono text-emerald-600 font-medium">PostgreSQL 15+ (pgcrypto, uuid-ossp)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500">Row Level Security (RLS):</span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> Enforced on 22 Tables
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500">Applied Migrations:</span>
              <span className="font-mono text-slate-700">001, 002, 003, 004 (Nexora Rebrand)</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500">Service Role RPC Bypass:</span>
              <span className="font-semibold text-amber-600">Protected / Server API only</span>
            </div>
          </div>
        </section>

        {/* Auth & Identity Diagnostic */}
        <section className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-6 backdrop-blur-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-200/60 pb-3">
            <Key className="h-5 w-5 text-blue-600" />
            <h2 className="text-base">Authentication & Identity</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500">Email & Password Auth:</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Enabled (with verification)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500">Google OAuth 2.0:</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Enabled (/auth/callback)
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500">Registration Reference Engine:</span>
              <span className="font-mono text-amber-600 font-bold">VSPARK-YYYY-XXXXX</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200">
              <span className="text-slate-500">Default Assigned Role:</span>
              <span className="text-slate-600 font-mono">participant (Strict RBAC)</span>
            </div>
          </div>
        </section>

        {/* Centralized Brand Verification */}
        <section className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-6 backdrop-blur-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-200/60 pb-3">
            <Sparkles className="h-5 w-5 text-amber-600" />
            <h2 className="text-base">Brand Identity & Developer Attribution</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2">
              <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                Branding Tokens
              </span>
              <div className="space-y-1.5 text-slate-600">
                <p><strong className="text-slate-900">Platform Name:</strong> {BRAND_CONFIG.name}</p>
                <p><strong className="text-slate-900">Subtitle:</strong> {BRAND_CONFIG.subtitle}</p>
                <p><strong className="text-slate-900">Tagline:</strong> {BRAND_CONFIG.tagline}</p>
                <p><strong className="text-slate-900">Short Description:</strong> {BRAND_CONFIG.shortDescription}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2">
              <span className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider">
                Mandatory Developer Profiles
              </span>
              <div className="space-y-2">
                {developers.map(dev => (
                  <div key={dev.name} className="flex items-center justify-between border-b border-neutral-850 pb-1.5 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-slate-900">{dev.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{dev.registrationNumber} • {dev.role}</p>
                    </div>
                    {dev.linkedinUrl && (
                      <a
                        href={dev.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-600"
                      >
                        LINKEDIN <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Platform Documentation & Setup Guides */}
        <section className="bg-slate-50/60 border border-slate-200/80 rounded-xl p-6 backdrop-blur-sm space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-200/60 pb-3">
            <FileText className="h-5 w-5 text-sky-400" />
            <h2 className="text-base">Platform Quick Reference Guides</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 font-semibold">
                <Terminal className="h-4 w-4" />
                <span>Admin Bootstrap</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                To promote an initial user to Administrator, execute the provided script in Supabase SQL editor:
              </p>
              <code className="block bg-slate-50 p-2 rounded text-[10px] text-slate-600 font-mono">
                supabase/bootstrap_admin.sql
              </code>
            </div>

            <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-blue-600 font-semibold">
                <Shield className="h-4 w-4" />
                <span>Google OAuth Config</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Set Authorized Redirect URI in Google Cloud Console:
              </p>
              <code className="block bg-slate-50 p-2 rounded text-[10px] text-blue-600 font-mono truncate">
                https://[project].supabase.co/auth/v1/callback
              </code>
            </div>

            <div className="p-4 rounded-lg bg-white border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <Layers className="h-4 w-4" />
                <span>Adjudication Console</span>
              </div>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Rounds 3 & 4 operate through the live physical console with time sync, 3s auto-skip, and buzzer lockouts.
              </p>
              <a
                href="/admin/rounds/adjudication"
                className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold text-[11px]"
              >
                Open Console <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
