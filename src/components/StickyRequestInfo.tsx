'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';

interface StickyRequestInfoProps {
  children: ReactNode;
}

export default function StickyRequestInfo({ children }: StickyRequestInfoProps) {
  const [stickyState, setStickyState] = useState<'normal' | 'fixed' | 'bottom'>('normal');
  const [fixedLeft, setFixedLeft] = useState<number | null>(null);
  const [fixedWidth, setFixedWidth] = useState<number>(380);
  const [bottomTranslateY, setBottomTranslateY] = useState<number>(0);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find the parent section element
    if (placeholderRef.current) {
      sectionRef.current = placeholderRef.current.closest('section');
    }

    const updatePosition = () => {
      if (!placeholderRef.current || !contentRef.current) return;

      const placeholder = placeholderRef.current;
      const content = contentRef.current;
      const section = sectionRef.current;

      const placeholderRect = placeholder.getBoundingClientRect();
      const contentHeight = content.offsetHeight;
      const topOffset = 128; // lg:top-32 = 128px

      // Capture the left position and width when in normal state
      if (stickyState === 'normal' && placeholderRect.top > topOffset) {
        setFixedLeft(placeholderRect.left);
        setFixedWidth(content.offsetWidth);
      }

      // If no section found, just use fixed behavior
      if (!section) {
        if (placeholderRect.top <= topOffset) {
          setStickyState('fixed');
        } else {
          setStickyState('normal');
        }
        return;
      }

      const sectionRect = section.getBoundingClientRect();
      const sectionBottom = sectionRect.bottom;
      const contentBottom = topOffset + contentHeight;
      const bottomPadding = 32; // 32px padding from section bottom

      // Check if content would extend past section bottom
      if (placeholderRect.top <= topOffset) {
        if (sectionBottom < contentBottom + bottomPadding) {
          // Content would go past section - calculate transform to position at section bottom
          // The element will be in normal flow, so we calculate how much to translate it
          const targetTop = sectionBottom - contentHeight - bottomPadding;
          const translateY = targetTop - placeholderRect.top;
          setBottomTranslateY(translateY);
          setStickyState('bottom');
        } else {
          // Normal fixed state
          setStickyState('fixed');
        }
      } else {
        setStickyState('normal');
      }
    };

    // Update position on scroll
    window.addEventListener('scroll', updatePosition, { passive: true });
    // Update position on resize
    window.addEventListener('resize', updatePosition, { passive: true });

    // Initial position calculation
    updatePosition();

    return () => {
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [stickyState]);

  return (
    <div
      ref={placeholderRef}
      className={`${stickyState !== 'normal' ? 'lg:min-w-[320px] lg:max-w-[380px]' : ''}`}
      style={stickyState !== 'normal' ? { minHeight: contentRef.current?.offsetHeight } : undefined}
    >
      <div
        ref={contentRef}
        className={`
          ${stickyState === 'fixed' ? 'lg:fixed lg:top-32 lg:z-40' : ''}
          ${stickyState === 'bottom' ? 'lg:relative lg:z-40' : ''}
        `}
        style={
          stickyState === 'fixed' && fixedLeft !== null
            ? { left: fixedLeft, width: fixedWidth }
            : stickyState === 'bottom'
            ? { transform: `translateY(${bottomTranslateY}px)`, width: fixedWidth }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
}
