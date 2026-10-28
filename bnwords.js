// Numbers -> Bangla words for text-to-speech (the cloned voice can't read digits: "১৪ টাকা" -> "চৌদ্দ টাকা").
// Subtitles keep the digits; only the spoken text goes through spoken().
const W = ('শূন্য এক দুই তিন চার পাঁচ ছয় সাত আট নয় দশ এগারো বারো তেরো চৌদ্দ পনেরো ষোলো সতেরো আঠারো উনিশ ' +
  'বিশ একুশ বাইশ তেইশ চব্বিশ পঁচিশ ছাব্বিশ সাতাশ আঠাশ ঊনত্রিশ ত্রিশ একত্রিশ বত্রিশ তেত্রিশ চৌত্রিশ পঁয়ত্রিশ ছত্রিশ সাঁইত্রিশ আটত্রিশ ঊনচল্লিশ ' +
  'চল্লিশ একচল্লিশ বিয়াল্লিশ তেতাল্লিশ চুয়াল্লিশ পঁয়তাল্লিশ ছেচল্লিশ সাতচল্লিশ আটচল্লিশ ঊনপঞ্চাশ পঞ্চাশ একান্ন বাহান্ন তিপ্পান্ন চুয়ান্ন পঞ্চান্ন ছাপ্পান্ন সাতান্ন আটান্ন ঊনষাট ' +
  'ষাট একষট্টি বাষট্টি তেষট্টি চৌষট্টি পঁয়ষট্টি ছেষট্টি সাতষট্টি আটষট্টি ঊনসত্তর সত্তর একাত্তর বাহাত্তর তিয়াত্তর চুয়াত্তর পঁচাত্তর ছিয়াত্তর সাতাত্তর আটাত্তর ঊনআশি ' +
  'আশি একাশি বিরাশি তিরাশি চুরাশি পঁচাশি ছিয়াশি সাতাশি আটাশি ঊননব্বই নব্বই একানব্বই বিরানব্বই তিরানব্বই চুরানব্বই পঁচানব্বই ছিয়ানব্বই সাতানব্বই আটানব্বই নিরানব্বই').split(' ');
function words(n) {
  if (n < 100) return W[n];
  const parts = [];
  for (const [v, name] of [[1e7, 'কোটি'], [1e5, 'লাখ'], [1e3, 'হাজার']]) {
    if (n >= v) { parts.push(`${words(Math.floor(n / v))} ${name}`); n %= v; }
  }
  if (n >= 100) { parts.push(`${W[Math.floor(n / 100)]}শ`); n %= 100; }
  if (n) parts.push(W[n]);
  return parts.join(' ');
}
function number(s) {
  if (s.length > 12 || (s.length > 1 && s[0] === '0')) return [...s].map(d => W[+d]).join(' '); // phone numbers, codes: digit by digit
  return words(Number(s));
}
function spoken(text) {
  return String(text)
    .replace(/[০-৯]/g, d => String(d.charCodeAt(0) - 0x09E6))
    .replace(/(\d),(?=\d)/g, '$1')
    .replace(/(\d+)\.(\d+)/g, (_, a, b) => `${number(a)} দশমিক ${[...b].map(d => W[+d]).join(' ')}`)
    .replace(/\b(1[1-9]\d\d)(?=\s*(সাল|খ্রি))/g, (_, y) => `${W[+y.slice(0, 2)]}শ ${y % 100 ? W[y % 100] : ''}`.trim()) // ১৯৭১ সালে -> উনিশশ একাত্তর সালে
    .replace(/(\d+)\s*%/g, (_, a) => `${number(a)} শতাংশ`)
    .replace(/\d+/g, number);
}
module.exports = { spoken };
