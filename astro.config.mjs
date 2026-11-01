import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://saharatyokthuan.github.io',
  base: '/Claudy',
  trailingSlash: 'always',
  image: {
    // สร้างรูปหลายขนาด (srcset) ให้มือถือโหลดรูปเล็ก รวมถึงรูปในเนื้อบันทึก
    layout: 'constrained',
    responsiveStyles: true,
    breakpoints: [640, 960, 1440, 2000],
  },
});
