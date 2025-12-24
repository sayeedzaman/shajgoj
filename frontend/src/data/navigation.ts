export interface SubCategory {
  name: string;
  href: string;
}

export interface CategorySection {
  title: string;
  items: SubCategory[];
}

export interface NavCategory {
  name: string;
  href: string;
  badge?: 'red' | 'blue' | 'dark';
  sections?: CategorySection[];
}

export const navigationCategories: NavCategory[] = [
  {
    name: 'Makeup',
    href: '/category/makeup',
    sections: [
      {
        title: 'FACE',
        items: [
          { name: 'Foundation', href: '/category/makeup/foundation' },
          { name: 'Concealer', href: '/category/makeup/concealer' },
          { name: 'Primer', href: '/category/makeup/primer' },
          { name: 'Compact Powder', href: '/category/makeup/compact-powder' },
          { name: 'Loose Powder', href: '/category/makeup/loose-powder' },
          { name: 'Blush', href: '/category/makeup/blush' },
          { name: 'Highlighter', href: '/category/makeup/highlighter' },
          { name: 'Bronzer', href: '/category/makeup/bronzer' },
          { name: 'Setting Spray', href: '/category/makeup/setting-spray' },
        ],
      },
      {
        title: 'LIPS',
        items: [
          { name: 'Lipstick', href: '/category/makeup/lipstick' },
          { name: 'Lip Gloss', href: '/category/makeup/lip-gloss' },
          { name: 'Lip Liner', href: '/category/makeup/lip-liner' },
          { name: 'Lip Balm', href: '/category/makeup/lip-balm' },
          { name: 'Lip Tint', href: '/category/makeup/lip-tint' },
          { name: 'Liquid Lipstick', href: '/category/makeup/liquid-lipstick' },
        ],
      },
      {
        title: 'EYES',
        items: [
          { name: 'Mascara', href: '/category/makeup/mascara' },
          { name: 'Eyeliner', href: '/category/makeup/eyeliner' },
          { name: 'Eyeshadow', href: '/category/makeup/eyeshadow' },
          { name: 'Eyebrow', href: '/category/makeup/eyebrow' },
          { name: 'Kajal', href: '/category/makeup/kajal' },
          { name: 'False Lashes', href: '/category/makeup/false-lashes' },
        ],
      },
      {
        title: 'NAILS',
        items: [
          { name: 'Nail Polish', href: '/category/makeup/nail-polish' },
          { name: 'Nail Art', href: '/category/makeup/nail-art' },
          { name: 'Nail Care', href: '/category/makeup/nail-care' },
          { name: 'Nail Remover', href: '/category/makeup/nail-remover' },
        ],
      },
      {
        title: 'TOOLS',
        items: [
          { name: 'Brushes', href: '/category/makeup/brushes' },
          { name: 'Sponges', href: '/category/makeup/sponges' },
          { name: 'Makeup Kits', href: '/category/makeup/kits' },
        ],
      },
    ],
  },
  {
    name: 'Skin',
    href: '/category/skin',
    sections: [
      {
        title: 'FACE CARE',
        items: [
          { name: 'Face Wash', href: '/category/skin/face-wash' },
          { name: 'Face Scrub', href: '/category/skin/face-scrub' },
          { name: 'Face Mask', href: '/category/skin/face-mask' },
          { name: 'Toner', href: '/category/skin/toner' },
          { name: 'Serum', href: '/category/skin/serum' },
          { name: 'Moisturizer', href: '/category/skin/moisturizer' },
          { name: 'Sunscreen', href: '/category/skin/sunscreen' },
          { name: 'Night Cream', href: '/category/skin/night-cream' },
        ],
      },
      {
        title: 'BODY CARE',
        items: [
          { name: 'Body Lotion', href: '/category/skin/body-lotion' },
          { name: 'Body Wash', href: '/category/skin/body-wash' },
          { name: 'Body Scrub', href: '/category/skin/body-scrub' },
          { name: 'Body Oil', href: '/category/skin/body-oil' },
          { name: 'Hand Cream', href: '/category/skin/hand-cream' },
          { name: 'Foot Cream', href: '/category/skin/foot-cream' },
        ],
      },
      {
        title: 'LIP CARE',
        items: [
          { name: 'Lip Balm', href: '/category/skin/lip-balm' },
          { name: 'Lip Scrub', href: '/category/skin/lip-scrub' },
          { name: 'Lip Mask', href: '/category/skin/lip-mask' },
        ],
      },
      {
        title: 'EYE CARE',
        items: [
          { name: 'Eye Cream', href: '/category/skin/eye-cream' },
          { name: 'Eye Mask', href: '/category/skin/eye-mask' },
          { name: 'Eye Serum', href: '/category/skin/eye-serum' },
        ],
      },
    ],
  },
  {
    name: 'Hair',
    href: '/category/hair',
    sections: [
      {
        title: 'HAIR CARE',
        items: [
          { name: 'Shampoo', href: '/category/hair/shampoo' },
          { name: 'Conditioner', href: '/category/hair/conditioner' },
          { name: 'Hair Oil', href: '/category/hair/hair-oil' },
          { name: 'Hair Mask', href: '/category/hair/hair-mask' },
          { name: 'Hair Serum', href: '/category/hair/hair-serum' },
          { name: 'Leave-in Conditioner', href: '/category/hair/leave-in' },
        ],
      },
      {
        title: 'HAIR STYLING',
        items: [
          { name: 'Hair Spray', href: '/category/hair/hair-spray' },
          { name: 'Hair Gel', href: '/category/hair/hair-gel' },
          { name: 'Hair Wax', href: '/category/hair/hair-wax' },
          { name: 'Mousse', href: '/category/hair/mousse' },
        ],
      },
      {
        title: 'HAIR TREATMENT',
        items: [
          { name: 'Anti-Dandruff', href: '/category/hair/anti-dandruff' },
          { name: 'Hair Fall Control', href: '/category/hair/hair-fall' },
          { name: 'Hair Growth', href: '/category/hair/hair-growth' },
        ],
      },
      {
        title: 'TOOLS',
        items: [
          { name: 'Hair Dryer', href: '/category/hair/hair-dryer' },
          { name: 'Straightener', href: '/category/hair/straightener' },
          { name: 'Curler', href: '/category/hair/curler' },
        ],
      },
    ],
  },
  {
    name: 'Personal Care',
    href: '/category/personal-care',
    sections: [
      {
        title: 'BATH & BODY',
        items: [
          { name: 'Shower Gel', href: '/category/personal-care/shower-gel' },
          { name: 'Soap', href: '/category/personal-care/soap' },
          { name: 'Body Scrub', href: '/category/personal-care/body-scrub' },
        ],
      },
      {
        title: 'DEODORANT',
        items: [
          { name: 'Roll-On', href: '/category/personal-care/roll-on' },
          { name: 'Spray', href: '/category/personal-care/spray' },
          { name: 'Stick', href: '/category/personal-care/stick' },
        ],
      },
      {
        title: 'HYGIENE',
        items: [
          { name: 'Intimate Wash', href: '/category/personal-care/intimate-wash' },
          { name: 'Sanitizer', href: '/category/personal-care/sanitizer' },
          { name: 'Wet Wipes', href: '/category/personal-care/wipes' },
        ],
      },
    ],
  },
  {
    name: 'Undergarments',
    href: '/category/undergarments',
    badge: 'blue',
    sections: [
      {
        title: 'BRAS',
        items: [
          { name: 'T-Shirt Bra', href: '/category/undergarments/t-shirt-bra' },
          { name: 'Push-Up Bra', href: '/category/undergarments/push-up-bra' },
          { name: 'Sports Bra', href: '/category/undergarments/sports-bra' },
          { name: 'Wireless Bra', href: '/category/undergarments/wireless-bra' },
        ],
      },
      {
        title: 'PANTIES',
        items: [
          { name: 'Bikini', href: '/category/undergarments/bikini' },
          { name: 'Brief', href: '/category/undergarments/brief' },
          { name: 'Thong', href: '/category/undergarments/thong' },
        ],
      },
      {
        title: 'NIGHTWEAR',
        items: [
          { name: 'Nightgown', href: '/category/undergarments/nightgown' },
          { name: 'Pajama Set', href: '/category/undergarments/pajama' },
          { name: 'Nighty', href: '/category/undergarments/nighty' },
        ],
      },
    ],
  },
  {
    name: 'The Great Giga Sale',
    href: '/sale/giga-sale',
    badge: 'red',
  },
  {
    name: 'Men',
    href: '/category/men',
    badge: 'dark',
    sections: [
      {
        title: 'SKIN CARE',
        items: [
          { name: 'Face Wash', href: '/category/men/face-wash' },
          { name: 'Moisturizer', href: '/category/men/moisturizer' },
          { name: 'Sunscreen', href: '/category/men/sunscreen' },
        ],
      },
      {
        title: 'SHAVING',
        items: [
          { name: 'Shaving Cream', href: '/category/men/shaving-cream' },
          { name: 'After Shave', href: '/category/men/after-shave' },
          { name: 'Razor', href: '/category/men/razor' },
        ],
      },
      {
        title: 'HAIR CARE',
        items: [
          { name: 'Shampoo', href: '/category/men/shampoo' },
          { name: 'Hair Oil', href: '/category/men/hair-oil' },
          { name: 'Hair Wax', href: '/category/men/hair-wax' },
        ],
      },
      {
        title: 'FRAGRANCE',
        items: [
          { name: 'Perfume', href: '/category/men/perfume' },
          { name: 'Body Spray', href: '/category/men/body-spray' },
        ],
      },
    ],
  },
];

export const footerLinks = {
  topCategories: [
    { name: 'Makeup', href: '/category/makeup' },
    { name: 'Skin', href: '/category/skin' },
    { name: 'Eye Care', href: '/category/skin/eye-care' },
    { name: 'Hair', href: '/category/hair' },
    { name: 'Personal Care', href: '/category/personal-care' },
  ],
  quickLinks: [
    { name: 'Offers', href: '/offers' },
    { name: "Men's Products", href: '/category/men' },
    { name: 'Skin Concerns', href: '/skin-concerns' },
    { name: 'New Arrival', href: '/new-arrival' },
  ],
  help: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQs', href: '/faqs' },
    { name: 'Shipping & Delivery', href: '/shipping' },
    { name: 'Terms & Conditions', href: '/terms' },
    { name: 'Refund & Return Policy', href: '/refund-policy' },
    { name: 'Privacy Policy', href: '/privacy-policy' },
  ],
  company: [
    { name: 'Our Story', href: '/about' },
    { name: 'Khali\'s Beauty Magazine', href: '/magazine' },
    { name: 'Join Our Team', href: '/careers' },
  ],
};