/**
 * Card template registry.
 *
 * Each template supplies markup only — all styling lives in
 * assets/css/templates.css, keyed off the wrapper's theme class.
 *
 * Any `{placeholder}` in `html` that is not a SYSTEM_FIELD automatically gets
 * an input in the sidebar, so adding a field to a template is enough to expose
 * it in the UI.
 */
window.PC = window.PC || {};

PC.templates = (function () {
    'use strict';

    const SYSTEM_FIELDS = [
        'image', 'logo', 'imageScale', 'imageX', 'imageY', 'imageObjectFit',
        'font', 'ratio_class', 'overlay'
    ];

    /** Fields rendered as a multi-line textarea in the sidebar. */
    const LONG_TEXT_FIELDS = ['heading', 'quote', 'content', 'subheading', 'summary', 'note'];

    const logoBlock = `
    <div class="card-logo">
      <img src="{logo}" class="card-logo-img" alt="Channel logo" />
    </div>`;

    const TEMPLATES = [
        {
            id: 'utsab',
            name: 'Utsab TV',
            nameBn: 'উৎসব টিভি',
            description: 'Official broadcast photocard with the Utsab TV footer frame, ribbon date badge and crimson headline panel.',
            accent: '#9e1b2f',
            defaults: {
                heading: 'বঞ্চিতই থাকছে মার্কিন সাধারণ ভোক্তারা, লাভবান হচ্ছে কারা',
                date: ''
            },
            html: `
      <div class="template-wrapper utsab-theme {ratio_class}" style="--font: '{font}';">
        <div class="utsab-photo-area">
          <img src="{image}" class="utsab-main-photo card-main-photo" alt="Photo" />
          <div class="card-photo-scrim" style="opacity: {overlay};"></div>
          <div class="utsab-channel-logo card-logo">
            <img src="{logo}" class="utsab-default-logo-img card-logo-img" alt="Utsab TV" />
          </div>
        </div>
        <div class="utsab-bottom-frame">
          <img src="assets/img/frame-utsab.png" class="utsab-frame-bg" alt="" />
          <div class="utsab-date-ribbon">
            <span class="utsab-date-text">{date}</span>
          </div>
          <div class="utsab-headline-box card-fit-box">
            <h1 class="utsab-heading card-fit-text">{heading}</h1>
          </div>
        </div>
      </div>`
        },

        {
            id: 'breaking',
            name: 'Breaking News',
            nameBn: 'ব্রেকিং নিউজ',
            description: 'Full-bleed photo with a breaking badge and a gradient headline block. Works in every ratio.',
            accent: '#d21e2b',
            defaults: {
                badge: 'ব্রেকিং নিউজ',
                heading: 'রাজধানীতে ভারী বর্ষণ, বেশ কয়েকটি এলাকায় জলাবদ্ধতা',
                source: 'উৎসব টিভি নিউজ ডেস্ক',
                date: ''
            },
            html: `
      <div class="template-wrapper breaking-theme {ratio_class}" style="--font: '{font}';">
        <div class="card-photo-area">
          <img src="{image}" class="card-main-photo" alt="Photo" />
          <div class="card-photo-scrim" style="opacity: {overlay};"></div>
        </div>
        <div class="card-gradient"></div>
        ${logoBlock}
        <div class="breaking-badge"><span class="breaking-dot"></span><span>{badge}</span></div>
        <div class="breaking-content">
          <div class="breaking-headline-box card-fit-box">
            <h1 class="breaking-heading card-fit-text">{heading}</h1>
          </div>
          <div class="breaking-meta">
            <span class="breaking-source">{source}</span>
            <span class="breaking-date">{date}</span>
          </div>
        </div>
      </div>`
        },

        {
            id: 'quote',
            name: 'Quote Card',
            nameBn: 'উদ্ধৃতি',
            description: 'Portrait on one side, large pull quote on the other, with speaker name and role.',
            accent: '#0b6b4f',
            defaults: {
                quote: 'দেশের মানুষের কল্যাণেই সব সিদ্ধান্ত নেওয়া হবে',
                author: 'মোঃ আব্দুল করিম',
                role: 'পরিকল্পনা উপদেষ্টা',
                date: ''
            },
            html: `
      <div class="template-wrapper quote-theme {ratio_class}" style="--font: '{font}';">
        <div class="quote-photo-side">
          <img src="{image}" class="card-main-photo" alt="Photo" />
          <div class="card-photo-scrim" style="opacity: {overlay};"></div>
        </div>
        <div class="quote-text-side">
          <div class="quote-mark">&ldquo;</div>
          <div class="quote-body card-fit-box">
            <p class="quote-text card-fit-text">{quote}</p>
          </div>
          <div class="quote-attrib">
            <div class="quote-rule"></div>
            <div class="quote-author">{author}</div>
            <div class="quote-role">{role}</div>
          </div>
          <div class="quote-footer">
            <img src="{logo}" class="card-logo-img" alt="Logo" />
            <span class="quote-date">{date}</span>
          </div>
        </div>
      </div>`
        },

        {
            id: 'live',
            name: 'Live',
            nameBn: 'লাইভ',
            description: 'Live broadcast lower-third with location strip and on-air indicator.',
            accent: '#c0202a',
            defaults: {
                badge: 'লাইভ',
                heading: 'সরাসরি সম্প্রচার চলছে',
                location: 'ঢাকা, বাংলাদেশ',
                date: ''
            },
            html: `
      <div class="template-wrapper live-theme {ratio_class}" style="--font: '{font}';">
        <div class="card-photo-area card-photo-full">
          <img src="{image}" class="card-main-photo" alt="Photo" />
          <div class="card-photo-scrim" style="opacity: {overlay};"></div>
        </div>
        <div class="card-gradient"></div>
        ${logoBlock}
        <div class="live-badge"><span class="live-dot"></span>{badge}</div>
        <div class="live-lower-third">
          <div class="live-bar">
            <div class="live-headline-box card-fit-box">
              <h1 class="live-heading card-fit-text">{heading}</h1>
            </div>
          </div>
          <div class="live-strip">
            <span class="live-location">{location}</span>
            <span class="live-date">{date}</span>
          </div>
        </div>
      </div>`
        },

        {
            id: 'sports',
            name: 'Sports Score',
            nameBn: 'খেলার স্কোর',
            description: 'Two-team scoreline over a match photo, with status line and date.',
            accent: '#0d3b66',
            defaults: {
                team1: 'বাংলাদেশ',
                score1: '২৪৫/৭',
                team2: 'শ্রীলঙ্কা',
                score2: '২৪১/১০',
                status: 'বাংলাদেশ ৪ রানে জয়ী',
                date: ''
            },
            html: `
      <div class="template-wrapper sports-theme {ratio_class}" style="--font: '{font}';">
        <div class="card-photo-area card-photo-full">
          <img src="{image}" class="card-main-photo" alt="Photo" />
          <div class="card-photo-scrim" style="opacity: {overlay};"></div>
        </div>
        <div class="card-gradient"></div>
        ${logoBlock}
        <div class="sports-panel">
          <div class="sports-row">
            <span class="sports-team">{team1}</span>
            <span class="sports-score">{score1}</span>
          </div>
          <div class="sports-divider"><span>বনাম</span></div>
          <div class="sports-row">
            <span class="sports-team">{team2}</span>
            <span class="sports-score">{score2}</span>
          </div>
          <div class="sports-status-box card-fit-box">
            <div class="sports-status card-fit-text">{status}</div>
          </div>
          <div class="sports-date">{date}</div>
        </div>
      </div>`
        },

        {
            id: 'obituary',
            name: 'Obituary',
            nameBn: 'শোক সংবাদ',
            description: 'Muted memorial card with framed portrait, name, role and lifespan.',
            accent: '#2f3640',
            defaults: {
                heading: 'শোক সংবাদ',
                name: 'অধ্যাপক রফিকুল ইসলাম',
                role: 'শিক্ষাবিদ ও গবেষক',
                lifespan: '১৯৪৮ — ২০২৬',
                date: ''
            },
            html: `
      <div class="template-wrapper obituary-theme {ratio_class}" style="--font: '{font}';">
        <div class="obit-header">{heading}</div>
        <div class="obit-portrait-frame">
          <div class="obit-portrait">
            <img src="{image}" class="card-main-photo" alt="Portrait" />
            <div class="card-photo-scrim" style="opacity: {overlay};"></div>
          </div>
        </div>
        <div class="obit-body">
          <div class="obit-name card-fit-text">{name}</div>
          <div class="obit-role">{role}</div>
          <div class="obit-lifespan">{lifespan}</div>
        </div>
        <div class="obit-footer">
          <img src="{logo}" class="card-logo-img" alt="Logo" />
          <span class="obit-date">{date}</span>
        </div>
      </div>`
        },

        {
            id: 'weather',
            name: 'Weather',
            nameBn: 'আবহাওয়া',
            description: 'Weather bulletin card with temperature, condition, city and an advisory line.',
            accent: '#1565a0',
            defaults: {
                heading: 'আবহাওয়ার পূর্বাভাস',
                temp: '৩২°',
                condition: 'বজ্রসহ বৃষ্টির সম্ভাবনা',
                city: 'ঢাকা',
                note: 'উপকূলীয় এলাকায় ৩ নম্বর সতর্ক সংকেত',
                date: ''
            },
            html: `
      <div class="template-wrapper weather-theme {ratio_class}" style="--font: '{font}';">
        <div class="card-photo-area card-photo-full">
          <img src="{image}" class="card-main-photo" alt="Photo" />
          <div class="card-photo-scrim" style="opacity: {overlay};"></div>
        </div>
        <div class="card-gradient"></div>
        ${logoBlock}
        <div class="weather-title">{heading}</div>
        <div class="weather-panel">
          <div class="weather-main">
            <div class="weather-temp">{temp}</div>
            <div class="weather-side">
              <div class="weather-city">{city}</div>
              <div class="weather-condition">{condition}</div>
            </div>
          </div>
          <div class="weather-note-box card-fit-box">
            <div class="weather-note card-fit-text">{note}</div>
          </div>
          <div class="weather-date">{date}</div>
        </div>
      </div>`
        }
    ];

    function getTemplates() {
        return TEMPLATES;
    }

    function getTemplate(id) {
        return TEMPLATES.find(t => t.id === id) || TEMPLATES[0];
    }

    /** Unique `{placeholder}` names in a template's markup, in order. */
    function extractPlaceholders(html) {
        const regex = /{([a-zA-Z0-9_]+)}/g;
        const found = new Set();
        let match;
        while ((match = regex.exec(html)) !== null) found.add(match[1]);
        return Array.from(found);
    }

    /** Content fields only — what the sidebar should render inputs for. */
    function contentFieldsOf(template) {
        return extractPlaceholders(template.html).filter(f => !SYSTEM_FIELDS.includes(f));
    }

    return {
        TEMPLATES, SYSTEM_FIELDS, LONG_TEXT_FIELDS,
        getTemplates, getTemplate, extractPlaceholders, contentFieldsOf
    };
})();
