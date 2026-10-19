/**
 * Bengali numeral + date formatting helpers.
 */
window.PC = window.PC || {};

PC.bengali = (function () {
    'use strict';

    const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

    const BENGALI_MONTHS = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];

    const BENGALI_TO_LATIN = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };

    function toBengaliNumerals(num, padZero) {
        let str = String(num);
        if (padZero && str.length === 1) str = '0' + str;
        return str.split('').map(d => (BENGALI_DIGITS[d] !== undefined ? BENGALI_DIGITS[d] : d)).join('');
    }

    function formatBengaliDate(year, monthIndex, day) {
        return `${toBengaliNumerals(day, true)} ${BENGALI_MONTHS[monthIndex]} ${toBengaliNumerals(year, false)}`;
    }

    /** "০২ সেপ্টেম্বর ২০২৬" -> "2026-09-02" ("" when unparseable). */
    function parseBengaliDateToISO(str) {
        if (!str) return '';
        const normalized = String(str).replace(/[০-৯]/g, d => BENGALI_TO_LATIN[d]);
        for (let i = 0; i < BENGALI_MONTHS.length; i++) {
            if (!normalized.includes(BENGALI_MONTHS[i])) continue;
            const nums = normalized.split(/\s+/).map(p => parseInt(p, 10)).filter(n => !isNaN(n));
            const day = nums.find(n => n >= 1 && n <= 31);
            const year = nums.find(n => n >= 1900 && n <= 2100);
            if (day && year) {
                return `${year}-${String(i + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            }
        }
        return '';
    }

    function getTodayBengaliDate() {
        const now = new Date();
        return formatBengaliDate(now.getFullYear(), now.getMonth(), now.getDate());
    }

    function getBengaliDateOffset(dayOffset) {
        const d = new Date();
        d.setDate(d.getDate() + dayOffset);
        return formatBengaliDate(d.getFullYear(), d.getMonth(), d.getDate());
    }

    function getTodayISODate() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    function getISODateOffset(dayOffset) {
        const d = new Date();
        d.setDate(d.getDate() + dayOffset);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    /** 24h clock -> "সন্ধ্যা ০৭:৩০" style Bengali time label. */
    function formatBengaliTime(hours, minutes) {
        let period = 'রাত';
        if (hours >= 4 && hours < 12) period = 'সকাল';
        else if (hours >= 12 && hours < 16) period = 'দুপুর';
        else if (hours >= 16 && hours < 19) period = 'বিকাল';
        else if (hours >= 19 && hours < 22) period = 'সন্ধ্যা';

        let h12 = hours % 12;
        if (h12 === 0) h12 = 12;
        return `${period} ${toBengaliNumerals(h12, true)}:${toBengaliNumerals(minutes, true)}`;
    }

    function getCurrentBengaliTime() {
        const now = new Date();
        return formatBengaliTime(now.getHours(), now.getMinutes());
    }

    /** Extract y/m/d from an ISO-ish or free-form date string. */
    function isoDatePartsFrom(raw) {
        if (!raw) return null;
        const text = String(raw).trim();

        const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (iso) return { y: Number(iso[1]), m: Number(iso[2]) - 1, d: Number(iso[3]) };

        const parsed = new Date(text);
        if (!isNaN(parsed.getTime())) {
            return { y: parsed.getFullYear(), m: parsed.getMonth(), d: parsed.getDate() };
        }
        return null;
    }

    return {
        BENGALI_DIGITS, BENGALI_MONTHS,
        toBengaliNumerals, formatBengaliDate, parseBengaliDateToISO,
        getTodayBengaliDate, getBengaliDateOffset, getTodayISODate, getISODateOffset,
        formatBengaliTime, getCurrentBengaliTime, isoDatePartsFrom
    };
})();
