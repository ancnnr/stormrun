import React, { useState } from "react";
import { Dialog, DialogHeader, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StayInformedModalProps {
  open: boolean;
  onClose: () => void;
}

const StayInformedModal: React.FC<StayInformedModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);
    // Simulate API call
    setTimeout(() => {
      if (email.includes("@")) {
        setSuccess(true);
        setEmail("");
      } else {
        setError("Please enter a valid email address.");
      }
      setSubmitting(false);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogHeader>
        <h2 className="text-2xl font-bold mb-2">Stay Informed</h2>
        <p className="text-muted-foreground mb-4">Sign up to get updates about StormRun.</p>
      </DialogHeader>
      <DialogContent>
        <form onSubmit={handleSubmit} className="w-full">
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="mb-4"
          />
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          {success && <div className="text-green-500 text-sm mb-2">Thank you for signing up!</div>}
        </form>
      </DialogContent>
      <DialogFooter>
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Submitting..." : "Sign Up"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default StayInformedModal;
