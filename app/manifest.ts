import { MetadataRoute } from 'next';
import Icon72 from '@/images/icons/72.png';
import Icon96 from '@/images/icons/96.png';
import Icon128 from '@/images/icons/128.png';
import Icon144 from '@/images/icons/144.png';
import Icon152 from '@/images/icons/152.png';
import Icon192 from '@/images/icons/192.png';
import Icon384 from '@/images/icons/384.png';
import Icon512 from '@/images/icons/512.png';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Media Center',
    short_name: 'Media Center',
    description: 'All your HLS streams in one place',
    start_url: '/',
    display: 'standalone',
    background_color: '#fff',
    theme_color: '#fff',
    icons: [
      {
        src: Icon72.src,
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: Icon96.src,
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: Icon128.src,
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: Icon144.src,
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: Icon152.src,
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: Icon192.src,
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: Icon384.src,
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: Icon512.src,
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
