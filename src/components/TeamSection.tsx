import Link from 'next/link';
import Image from 'next/image';
import { createImageUrlBuilder } from '@sanity/image-url';
import { client } from '@/sanity/client';

const builder = createImageUrlBuilder(client);

function urlFor(source: any) {
  return builder.image(source);
}

interface TeamMember {
  name?: string;
  slug?: { current: string };
  title?: string;
  bio?: string;
  image?: any;
  email?: string;
  phone?: string;
  mobile?: string;
  office?: string;
  address?: string;
}

interface TeamSectionProps {
  title?: string;
  imagePosition?: 'left' | 'right';
  teamMember?: TeamMember;
  primaryButtonText?: string;
  primaryButtonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

export default function TeamSection({
  title = 'Our Team',
  imagePosition = 'left',
  teamMember,
  primaryButtonText = 'LEARN MORE',
  primaryButtonLink = '/about/our-team',
  secondaryButtonText = 'SCHEDULE A CALL',
  secondaryButtonLink = '/contact-us',
}: TeamSectionProps) {
  if (!teamMember) {
    return null;
  }

  const isImageLeft = imagePosition === 'left';
  const teamMemberUrl = teamMember.slug?.current ? `/team/${teamMember.slug.current}` : null;

  return (
    <section className="w-full py-12 md:py-16 lg:py-20" itemScope itemType="https://schema.org/Person">
      <div className={`max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start gap-6 sm:gap-8 lg:gap-12 ${isImageLeft ? '' : 'md:flex-row-reverse'}`}>
        {/* Image */}
        <div className="w-full md:w-1/2 lg:w-[55%] flex-shrink-0">
          {teamMember.image && (
            teamMemberUrl ? (
              <Link href={teamMemberUrl}>
                <Image
                  src={urlFor(teamMember.image).width(1000).url()}
                  alt={teamMember.name || 'Team member'}
                  width={1000}
                  height={1000}
                  className="w-full h-auto"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 55vw"
                  loading="lazy"
                  itemProp="image"
                />
              </Link>
            ) : (
              <Image
                src={urlFor(teamMember.image).width(1000).url()}
                alt={teamMember.name || 'Team member'}
                width={1000}
                height={1000}
                className="w-full h-auto"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 55vw"
                loading="lazy"
                itemProp="image"
              />
            )
          )}
        </div>

        {/* Content */}
        <div className="w-full md:w-1/2 lg:w-[45%] md:pl-6 lg:pl-8 xl:pl-16">
          <h1 className="!mt-0 !pt-0 mb-3 sm:mb-4 lg:mb-6 text-[var(--color-sothebys-blue)] dark:text-white">
            {title}
          </h1>

          {teamMember.name && (
            <span className="hidden" itemProp="name">{teamMember.name}</span>
          )}

          {teamMember.title && (
            <span className="hidden" itemProp="jobTitle">{teamMember.title}</span>
          )}

          {teamMember.bio && (
            <p className="mb-6 sm:mb-8 lg:mb-10 text-sm sm:text-base md:text-base lg:text-lg text-[#4a4a4a] dark:text-gray-300 leading-relaxed md:leading-relaxed lg:leading-loose" itemProp="description">
              {teamMember.bio}
            </p>
          )}

          {secondaryButtonText && secondaryButtonLink && (
            <Link
              href={secondaryButtonLink}
              className="sir-btn"
            >
              <span>{secondaryButtonText}</span>
              <span className="sir-arrow" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
