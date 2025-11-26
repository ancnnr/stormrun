import React, { useEffect, useState } from "react";

type Props = {
  actionUrl?: string; // MailerLite form action endpoint
  initiallyVisible?: boolean;
  onSuccess?: () => void;
  className?: string;
};

function generateGuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return (
    s4() +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    "-" +
    s4() +
    s4() +
    s4()
  );
}

export default function MailerLiteInlineBanner({
  actionUrl = "https://assets.mailerlite.com/public/1933719/forms/171602898578310422/subscribe?signature=1fe7adc2c9f40d3911086c3627761745bea73cdddae995967f6241d8a527d2f5",
  initiallyVisible = false,
  onSuccess,
  className = "",
}: Props) {
  const [visible, setVisible] = useState(initiallyVisible);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Persist or initialize guid similar to MailerLite builder
    if (typeof window !== "undefined") {
      (window as any).ml_guid_string =
        (window as any).ml_guid_string || window.localStorage?.ml_guid || "";
      if (!((window as any).ml_guid_string)) {
        const g = generateGuid();
        (window as any).ml_guid_string = g;
        try {
          window.localStorage && (window.localStorage.ml_guid = g);
        } catch {
          // ignore storage errors
        }
      }
    }
  }, []);

  const validateEmail = (v: string) => {
    const re = /^([a-zA-Z0-9_.+-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]){2,40}$/;
    return re.test(v.trim());
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError("Please enter a valid email.");
      return;
    }

    setSubmitting(true);
    try {
      // Build the MailerLite-shaped payload like their builder serialize_form_data
      const payload: any = {};
      payload.fields = { email: email.trim() };
      payload.guid = (window as any).ml_guid_string || generateGuid();

      const res = await fetch(actionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "omit",
      });

      const body = await res.json().catch(() => ({}));
      if (res.status === 200 && body.success !== false) {
        setSuccess(true);
        setVisible(false);
        onSuccess?.();
      } else {
        setError(body.message || "Submission failed. Try again.");
      }
    } catch (err) {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

if (success) {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 bg-green-600 text-white border-t border-green-700 p-4 md:p-6 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-5 h-5 text-white"
              aria-hidden="true"
            >
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <div>
            <div className="font-semibold">Thanks — you're on the list!</div>
            <div className="text-sm text-white/90">We'll send updates to <span className="font-medium">{email}</span></div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSuccess(false);
              setVisible(false);
            }}
            className="text-sm underline text-white/90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 bg-[#12151e] text-white border-t border-[#a782f9]/30 p-4 md:p-6 ${className}`}
      style={{ display: visible ? "block" : "none" }}
      role="region"
      aria-label="Subscribe banner"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4 justify-between">
        <div>
          <h3 className="text-lg font-semibold">Be First to Experience StormRun</h3>
          <p className="text-sm text-[#87bcc3]">
            Get early access updates and launch invites — join the list.
          </p>
        </div>

        <form className="flex gap-3 w-full md:w-auto items-center" onSubmit={handleSubmit}>
          <input
            type="email"
            name="fields.email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            aria-label="email"
            required
            className="px-3 py-2 rounded-md w-full md:w-64 bg-[#0b0f17] border border-[#a782f9]/20"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-md bg-[#a782f9] text-black font-medium"
          >
            {submitting ? "Sending…" : "Join"}
          </button>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="ml-2 text-sm text-[#87bcc3] underline"
          >
            Dismiss
          </button>
        </form>
      </div>

      {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
      <style>{`
        @media (min-width: 768px) {
          .ml-banner-hide-mobile { display: block; }
        }
      `}</style>
    </div>
  );
}