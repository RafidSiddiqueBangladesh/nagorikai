// Grade-1 English Braille and Bharati/Bangla Unicode Braille conversion utilities

const EN_TO_BRAILLE: Record<string, string> = {
  a: '⠁', b: '⠃', c: '⠉', d: '⠙', e: '⠑', f: '⠋', g: '⠛', h: '⠓', i: '⠊', j: '⠚',
  k: '⠅', l: '⠇', m: '⠍', n: '⠝', o: '⠕', p: '⠏', q: '⠟', r: '⠗', s: '⠎', t: '⠞',
  u: '⠥', v: '⠧', w: '⠺', x: '⠭', y: '⠽', z: '⠵',
  '0': '⠼⠚', '1': '⠼⠁', '2': '⠼⠃', '3': '⠼⠉', '4': '⠼⠙',
  '5': '⠼⠑', '6': '⠼⠋', '7': '⠼⠛', '8': '⠼⠓', '9': '⠼⠊',
  ' ': ' ', '.': '⠲', ',': '⠂', '?': '⠦', '!': '⠖', '-': '⠤', ':': '⠒', ';': '⠆', '/': '⠸⠌',
  '\n': '\n',
};

// Bharati Braille standard mappings for Bengali Unicode characters
const BN_TO_BRAILLE: Record<string, string> = {
  // Vowels & Matras
  'অ': '⠁', 'আ': '⠜', 'া': '⠜', 'ই': '⠊', 'ি': '⠊', 'ঈ': '⠔', 'ী': '⠔',
  'উ': '⠥', 'ু': '⠥', 'ঊ': '⠳', 'ূ': '⠳', 'ঋ': '⠐⠗', 'ৃ': '⠐⠗',
  'এ': '⠑', 'ে': '⠑', 'ঐ': '⠌', 'ৈ': '⠌', 'ও': '⠕', 'ো': '⠕', 'ঔ': '⠪', 'ৌ': '⠪',
  // Consonants
  'ক': '⠅', 'খ': '⠨', 'গ': '⠛', 'ঘ': '⠣', 'ঙ': '⠬',
  'চ': '⠉', 'ছ': '⠡', 'জ': '⠚', 'ঝ': '⠴', 'ঞ': '⠒',
  'ট': '⠾', 'ঠ': '⠺', 'ড': '⠫', 'ঢ': '⠿', 'ণ': '⠼',
  'ত': '⠞', 'থ': '⠹', 'দ': '⠙', 'ধ': '⠮', 'ন': '⠝',
  'প': '⠏', 'ফ': '⠖', 'ব': '⠃', 'ভ': '⠘', 'ম': '⠍',
  'য': '⠽', 'র': '⠗', 'ল': '⠇', 'শ': '⠩', 'ষ': '⠯', 'স': '⠎', 'হ': '⠓',
  'ড়': '⠻', 'ঢ়': '⠻', 'য়': '⠢', 'ৎ': '⠞', 'ং': '⠰', 'ঃ': '⠠', 'ঁ': '⠄', '্': '⠈',
  // Bengali Digits
  '০': '⠼⠚', '১': '⠼⠁', '২': '⠼⠃', '৩': '⠼⠉', '৪': '⠼⠙',
  '৫': '⠼⠑', '৬': '⠼⠋', '৭': '⠼⠛', '৮': '⠼⠓', '৯': '⠼⠊',
  '।': '⠲',
};

const BRAILLE_TO_EN: Record<string, string> = {
  '⠁': 'a', '⠃': 'b', '⠉': 'c', '⠙': 'd', '⠑': 'e', '⠋': 'f', '⠛': 'g', '⠓': 'h', '⠊': 'i', '⠚': 'j',
  '⠅': 'k', '⠇': 'l', '⠍': 'm', '⠝': 'n', '⠕': 'o', '⠏': 'p', '⠟': 'q', '⠗': 'r', '⠎': 's', '⠞': 't',
  '⠥': 'u', '⠧': 'v', '⠺': 'w', '⠭': 'x', '⠽': 'y', '⠵': 'z',
  ' ': ' ', '⠲': '.', '⠂': ',', '⠦': '?', '⠖': '!', '⠤': '-', '⠒': ':',
};

const BRAILLE_TO_BN: Record<string, string> = {
  '⠁': 'অ', '⠜': 'আ', '⠊': 'ই', '⠔': 'ঈ', '⠥': 'উ', '⠳': 'ঊ', '⠑': 'এ', '⠌': 'ঐ', '⠕': 'ও', '⠪': 'ঔ',
  '⠅': 'ক', '⠨': 'খ', '⠛': 'গ', '⠣': 'ঘ', '⠬': 'ঙ',
  '⠉': 'চ', '⠡': 'ছ', '⠚': 'জ', '⠴': 'ঝ', '⠒': 'ঞ',
  '⠾': 'ট', '⠺': 'ঠ', '⠫': 'ড', '⠿': 'ঢ', '⠼': 'ণ',
  '⠞': 'ত', '⠹': 'থ', '⠙': 'দ', '⠮': 'ধ', '⠝': 'ন',
  '⠏': 'প', '⠖': 'ফ', '⠃': 'ব', '⠘': 'ভ', '⠍': 'ম',
  '⠽': 'য', '⠗': 'র', '⠇': 'ল', '⠩': 'শ', '⠯': 'ষ', '⠎': 'স', '⠓': 'হ',
  '⠻': 'ড়', '⠢': 'য়', '⠰': 'ং', '⠠': 'ঃ', '⠄': 'ঁ', '⠈': '্', '⠲': '।', ' ': ' ',
};

export function textToBraille(input: string): string {
  let out = '';
  for (const ch of input) {
    if (BN_TO_BRAILLE[ch]) {
      out += BN_TO_BRAILLE[ch];
    } else {
      const lower = ch.toLowerCase();
      if (EN_TO_BRAILLE[lower]) {
        out += EN_TO_BRAILLE[lower];
      } else {
        out += ch;
      }
    }
  }
  return out;
}

export function brailleToText(braille: string, lang: 'en' | 'bn' = 'en'): string {
  const map = lang === 'bn' ? BRAILLE_TO_BN : BRAILLE_TO_EN;
  let out = '';
  for (const ch of braille) {
    out += map[ch] ?? ch;
  }
  return out;
}

// Convert 6-dot array [d1..d6] into Unicode Braille character (U+2800 offset)
export function dotsToBrailleChar(dots: boolean[]): string {
  let mask = 0;
  for (let i = 0; i < 6; i++) {
    if (dots[i]) mask |= 1 << i;
  }
  return String.fromCharCode(0x2800 + mask);
}

export function downloadBrailleGuide(title: string, contentText: string): void {
  const braille = textToBraille(contentText);
  const full = `${title}\n${'='.repeat(title.length)}\n\n[BRAILLE UNICODE]\n${braille}\n\n[PLAIN ACCESSIBLE TEXT]\n${contentText}\n`;
  const blob = new Blob([full], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-braille.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
