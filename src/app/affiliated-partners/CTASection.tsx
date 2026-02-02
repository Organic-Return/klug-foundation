import Link from "next/link";

interface CTASectionProps {
  title?: string;
  description?: string;
  buttonText?: string;
  buttonAction?: string;
  buttonLink?: string;
}

export default function CTASection({
  title = "Let's Connect",
  description = "Whether you're looking to buy, sell, or invest in luxury real estate, our team of experts is here to guide you every step of the way.",
  buttonText = "Contact Us",
  buttonAction = "link",
  buttonLink = "/contact-us",
}: CTASectionProps) {
  // Determine the button/link based on action type
  const renderButton = () => {
    const buttonClasses =
      "inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-gold)] text-white text-sm font-light tracking-wider uppercase hover:bg-[var(--color-gold-dark)] transition-colors duration-300";

    if (buttonAction === "email" && buttonLink) {
      return (
        <a href={`mailto:${buttonLink}`} className={buttonClasses}>
          {buttonText}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </a>
      );
    }

    if (buttonAction === "phone" && buttonLink) {
      return (
        <a
          href={`tel:${buttonLink.replace(/[^0-9+]/g, "")}`}
          className={buttonClasses}
        >
          {buttonText}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        </a>
      );
    }

    // Default to link
    return (
      <Link href={buttonLink || "/contact-us"} className={buttonClasses}>
        {buttonText}
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 8l4 4m0 0l-4 4m4-4H3"
          />
        </svg>
      </Link>
    );
  };

  return (
    <section className="py-20 md:py-28 bg-[var(--color-navy)]">
      <div className="max-w-4xl mx-auto px-6 md:px-12 lg:px-16 text-center">
        {/* Gold accent line */}
        <div className="w-16 h-[1px] bg-[var(--color-gold)] mx-auto mb-8" />

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-serif font-light text-white tracking-wide mb-6">
          {title}
        </h2>

        {/* Description */}
        <p className="text-lg text-white/70 font-light leading-relaxed mb-10 max-w-2xl mx-auto">
          {description}
        </p>

        {/* CTA Button */}
        {renderButton()}
      </div>
    </section>
  );
}
