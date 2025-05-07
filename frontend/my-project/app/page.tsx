import Link from "next/link"

export default function Home() {
  return (
    <main
      className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white"
      style={{
        background: "linear-gradient(to bottom, #000000, #121212)",
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Premium gradient overlay */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(120, 120, 120, 0.3) 0%, rgba(0, 0, 0, 0) 70%)",
          pointerEvents: "none",
        }}
      />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 flex flex-col items-center">
        {/* Logo */}
        <div
          className="mb-16 text-center"
          style={{
            background: "linear-gradient(135deg, #e2e2e2 0%, #a0a0a0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "4.2rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
          }}
        >
          Magizh Technologies
        </div>

        {/* Main content */}
        <div className="w-full max-w-4xl text-center mb-16">
          <h1
            className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8"
            style={{
              background: "linear-gradient(to bottom, #ffffff 0%, #a0a0a0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
            }}
          >
            Employee Attendance Reimagined
          </h1>

          <p
            className="text-xl md:text-2xl mb-12 mx-auto max-w-3xl"
            style={{
              color: "#a0a0a0",
              fontWeight: 300,
              lineHeight: 1.5,
              letterSpacing: "-0.01em",
            }}
          >
            The world&apos;s most sophisticated attendance system, designed for enterprises that demand excellence. Precision
            tracking with unparalleled elegance.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-12">
            <Link href="/auth/login">
              <button
                className="px-10 py-4 rounded-full text-lg font-medium transition-all duration-300"
                style={{
                  background: "linear-gradient(135deg, #e2e2e2 0%, #a0a0a0 100%)",
                  color: "#000000",
                  boxShadow: "0 10px 30px rgba(160, 160, 160, 0.2)",
                  minWidth: "180px",
                }}
              >
                Sign In
              </button>
            </Link>

            <Link href="/auth/signup">
              <button
                className="px-10 py-4 rounded-full text-lg font-medium transition-all duration-300"
                style={{
                  background: "transparent",
                  color: "#a0a0a0",
                  border: "1px solid #333333",
                  minWidth: "180px",
                }}
              >
                Sign Up
              </button>
            </Link>
          </div>
        </div>

        {/* Premium features */}
        <div className="w-full mt-20">
          <div
            className="text-center mb-16"
            style={{
              color: "#a0a0a0",
              fontSize: "1.25rem",
              fontWeight: 300,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Premium Features
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <h3
                className="text-xl mb-4"
                style={{
                  background: "linear-gradient(to bottom, #ffffff 0%, #a0a0a0 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 500,
                }}
              >
                Biometric Integration
              </h3>
              <p style={{ color: "#707070", fontSize: "0.95rem", lineHeight: 1.6 }}>
                Seamless facial and fingerprint recognition for frictionless attendance.
              </p>
            </div>

            <div className="text-center">
              <h3
                className="text-xl mb-4"
                style={{
                  background: "linear-gradient(to bottom, #ffffff 0%, #a0a0a0 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 500,
                }}
              >
                Advanced Analytics
              </h3>
              <p style={{ color: "#707070", fontSize: "0.95rem", lineHeight: 1.6 }}>
                Comprehensive insights with predictive modeling and trend analysis.
              </p>
            </div>

            <div className="text-center">
              <h3
                className="text-xl mb-4"
                style={{
                  background: "linear-gradient(to bottom, #ffffff 0%, #a0a0a0 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 500,
                }}
              >
                Enterprise Security
              </h3>
              <p style={{ color: "#707070", fontSize: "0.95rem", lineHeight: 1.6 }}>
                Military-grade encryption and compliance with global security standards.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer
        className="w-full py-8 mt-20"
        style={{
          borderTop: "1px solid #222222",
        }}
      >
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div
              className="mb-4 md:mb-0"
              style={{
                color: "#505050",
                fontSize: "0.8rem",
              }}
            >
              2025 Enterprise Attendance. All rights reserved.
            </div>
            <div className="flex gap-8">
              <Link href="/privacy" style={{ color: "#505050", fontSize: "0.8rem" }}>
                Privacy
              </Link>
              <Link href="/terms" style={{ color: "#505050", fontSize: "0.8rem" }}>
                Terms
              </Link>
              <Link href="/support" style={{ color: "#505050", fontSize: "0.8rem" }}>
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
