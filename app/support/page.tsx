import Image from "next/image";
import Link from "next/link";

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-10 shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="PractCoach Logo"
            width={60}
            height={60}
            className="rounded-xl"
          />

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              PractCoach Support
            </h1>

            <p className="mt-1 text-gray-600">
              Welcome to the official PractCoach support page.
            </p>
          </div>
        </div>

        {/* Intro */}
        <section className="mt-8">
          <p className="text-gray-700 leading-7">
            Need help using PractCoach? Our team is here to help.
            You can find answers to the most common questions below or
            contact us directly.
          </p>
        </section>

        {/* Contact */}
        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-gray-900">
            Contact us
          </h2>

          <p className="mt-4 text-gray-700">
            If you have any questions or experience a technical issue,
            please contact us at:
          </p>

          <a
            href="mailto:support@practcoach.com"
            className="mt-3 inline-block text-lg font-semibold text-blue-600 hover:underline"
          >
            support@practcoach.com
          </a>

          <p className="mt-2 text-sm text-gray-500">
            We usually reply within <strong>24 to 48 hours</strong>.
          </p>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900">
            Frequently Asked Questions
          </h2>

          <div className="mt-8 space-y-8">
            <div>
              <h3 className="font-semibold text-gray-900">
                I did not receive my login email.
              </h3>

              <p className="mt-2 text-gray-700">
                Please check your Spam or Junk folder. If you still haven't
                received the email, return to the login page and request a new
                Magic Link.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                My Magic Link has expired.
              </h3>

              <p className="mt-2 text-gray-700">
                Login links are valid for a limited time. Simply request a new
                login link from the PractCoach login screen.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                How do subscriptions work?
              </h3>

              <p className="mt-2 text-gray-700">
                PractCoach offers coaching sessions that can be purchased
                securely through the Apple App Store and Google Play Store.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">
                How can I report a bug?
              </h3>

              <p className="mt-2 text-gray-700">
                Send us an email with your device model, operating system,
                screenshots (if available), and a description of the issue.
              </p>
            </div>
          </div>
        </section>

        {/* Legal */}
        <section className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Legal
          </h2>

          <div className="mt-5 flex flex-col gap-3">
            <Link
              href="/privacy"
              className="text-blue-600 hover:underline"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="text-blue-600 hover:underline"
            >
              Terms & Conditions
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-sm leading-6 text-gray-500">
            PractCoach is an AI-powered coaching practice application.
            It is intended for educational and training purposes only and
            does not provide medical, psychological, legal, or financial
            advice.
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-10 border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-500">
            PractCoach v1.0
          </p>

          <p className="mt-1 text-sm text-gray-500">
            © 2026 PractCoach. All rights reserved.
          </p>
        </footer>
      </div>
    </main>
  );
}