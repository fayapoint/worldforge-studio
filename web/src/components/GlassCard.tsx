"use client";

import { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  selected?: boolean;
  onClick?: () => void;
};

export function GlassCard({ children, className = "", hover = false, selected = false, onClick }: GlassCardProps) {
  const baseClasses = "rounded-2xl bg-white/40 backdrop-blur-xl border border-white/20 shadow-lg";
  const hoverClasses = hover ? "transition-all hover:scale-105 hover:bg-white/60 hover:shadow-xl cursor-pointer" : "";
  const selectedClasses = selected ? "ring-2 ring-indigo-500 bg-white/80" : "";

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${selectedClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

type GlassButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  className?: string;
};

export function GlassButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}: GlassButtonProps) {
  const baseClasses = "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:scale-105 hover:shadow-xl",
    secondary: "bg-white/40 backdrop-blur-xl border border-white/20 text-zinc-900 hover:bg-white/60",
    ghost: "text-zinc-700 hover:bg-white/40",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}

type IconOptionProps = {
  icon: ReactNode;
  label: string;
  description?: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
};

export function IconOption({ icon, label, description, selected = false, onClick, disabled = false }: IconOptionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`group relative overflow-hidden rounded-2xl p-4 text-left transition-all disabled:opacity-50 ${
        selected
          ? "bg-white/80 shadow-xl ring-2 ring-indigo-500 backdrop-blur-xl"
          : "bg-white/40 backdrop-blur-xl hover:bg-white/60 hover:scale-105"
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
      
      <div className="relative">
        <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
          selected
            ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg"
            : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
        }`}>
          {icon}
        </div>
        
        <div className="font-semibold text-zinc-900">{label}</div>
        {description && <div className="mt-1 text-sm text-zinc-600">{description}</div>}
      </div>

      {selected && (
        <div className="absolute right-3 top-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
}

type GlassInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "textarea";
  rows?: number;
};

export function GlassInput({ value, onChange, placeholder, type = "text", rows = 4 }: GlassInputProps) {
  const baseClasses = "w-full rounded-xl bg-white/40 backdrop-blur-xl border border-white/20 px-4 py-3 text-zinc-900 placeholder-zinc-500 shadow-sm transition-all focus:bg-white/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none";

  if (type === "textarea") {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={baseClasses}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={baseClasses}
    />
  );
}

type GlassSliderProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  icon?: ReactNode;
  lowLabel?: string;
  highLabel?: string;
};

export function GlassSlider({
  value,
  onChange,
  min = 0,
  max = 100,
  label,
  icon,
  lowLabel,
  highLabel,
}: GlassSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <div className="text-indigo-600">{icon}</div>}
          <label className="font-medium text-zinc-900">{label}</label>
        </div>
        <div className="rounded-lg bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700">
          {value}
        </div>
      </div>
      
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-white/40 rounded-lg appearance-none cursor-pointer backdrop-blur-xl [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-indigo-600 [&::-webkit-slider-thumb]:to-purple-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
      />
      
      {(lowLabel || highLabel) && (
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{lowLabel}</span>
          <span>{highLabel}</span>
        </div>
      )}
    </div>
  );
}
