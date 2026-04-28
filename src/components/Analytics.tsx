'use client';

import Script from 'next/script';

interface AnalyticsProps {
  gaId?: string;
  gtmId?: string;
  fbPixelId?: string;
  gadsConversionId?: string;
}

export default function Analytics({ gaId, gtmId, fbPixelId, gadsConversionId }: AnalyticsProps) {
  if (!gaId && !gtmId && !fbPixelId) return null;

  return (
    <>
      {/* Google Analytics (gtag.js) */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="lazyOnload"
          />
          <Script id="google-analytics" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
              ${gadsConversionId ? `gtag('config', '${gadsConversionId}');` : ''}
            `}
          </Script>
        </>
      )}

      {/* Google Tag Manager */}
      {gtmId && !gaId && (
        <>
          <Script id="google-tag-manager" strategy="lazyOnload">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        </>
      )}

      {/* Facebook Pixel */}
      {fbPixelId && (
        <Script id="facebook-pixel" strategy="lazyOnload">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${fbPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
