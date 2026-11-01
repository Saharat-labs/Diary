import { defineConfig } from 'astro/config';
import remarkBreaks from 'remark-breaks';

export default defineConfig({
  site: 'https://saharatyokthuan.github.io',
  base: '/Claudy',
  trailingSlash: 'always',
  markdown: {
    // ข้อความที่คัดลอกจาก Samsung Notes ขึ้นบรรทัดใหม่ด้วย Enter ครั้งเดียว ให้แสดงเป็นการขึ้นบรรทัดใหม่ ไม่ใช่ติดกันเป็นย่อหน้าเดียว
    remarkPlugins: [remarkBreaks],
  },
  image: {
    // สร้างรูปหลายขนาด (srcset) ให้มือถือโหลดรูปเล็ก รวมถึงรูปในเนื้อบันทึก
    layout: 'constrained',
    responsiveStyles: true,
    breakpoints: [640, 960, 1440, 2000],
  },
});
