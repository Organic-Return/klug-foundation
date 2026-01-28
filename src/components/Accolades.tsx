import Image from 'next/image';
import imageUrlBuilder from '@sanity/image-url';
import { client } from '@/sanity/client';

const builder = imageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

interface AccoladeItem {
  type: 'number' | 'numberWithPrefix' | 'image';
  value?: string;
  prefix?: string;
  image?: any;
  label?: string;
}

interface AccoladesProps {
  title?: string;
  backgroundImage?: any;
  items?: AccoladeItem[];
}

export default function Accolades({
  title = 'Our Accolades',
  backgroundImage,
  items = [],
}: AccoladesProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const backgroundUrl = backgroundImage?.asset?.url
    ? urlFor(backgroundImage).width(1920).url()
    : undefined;

  return (
    <section
      className="relative w-full"
      style={{
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-[#f8f7f5]/90 dark:bg-[#141414]/90" />
      <div className="relative py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <h1 className="font-serif text-[var(--color-sothebys-blue)] dark:text-white">
              {title}
            </h1>
          </div>

          <div className="bg-white/80 dark:bg-[#1a1a1a]/80 py-12 px-6 md:px-8">
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-8">
            {items.map((item, index) => (
              <div
                key={index}
                className={`flex flex-col items-center text-center ${
                  index % 3 === 1 ? 'lg:border-l lg:border-r lg:border-[#e5e5e5] dark:lg:border-gray-700' : ''
                }`}
              >
                {/* Display Value or Image */}
                {item.type === 'image' && item.image ? (
                  <div className="h-24 md:h-28 flex justify-center items-center mb-4">
                    <div className="relative h-20 w-20 md:h-24 md:w-24">
                      <Image
                        src={urlFor(item.image).width(200).url()}
                        alt={item.label || 'Accolade'}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-[#1a1a1a] dark:text-white font-serif font-light mb-4" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', letterSpacing: '-0.02em', lineHeight: '1' }}>
                    {item.type === 'numberWithPrefix' && item.prefix && (
                      <span className="text-[var(--color-gold)]" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
                        {item.prefix}
                      </span>
                    )}
                    {item.value}
                  </div>
                )}

                {/* Decorative line */}
                <div className="w-8 h-px bg-[var(--color-gold)] mb-4" />

                {/* Label */}
                {item.label && (
                  <span className="text-[#6a6a6a] dark:text-gray-400 text-sm font-light tracking-wide leading-relaxed">{item.label}</span>
                )}
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
