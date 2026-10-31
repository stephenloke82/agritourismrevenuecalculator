/*
 * ===================================================================
 *  CALCULATOR SETTINGS — this is the only file you need to edit.
 * ===================================================================
 *  Change the text between the quote marks, save, and push to GitHub.
 *  Keep the quote marks and the commas at the end of each line.
 *  Never put passwords or secret keys in this file: everyone can see it.
 */
window.CALCULATOR_CONFIG = {

  // ---- Money ------------------------------------------------------
  // Currency code (USD, CAD, GBP, EUR, AUD, NZD...) and number style.
  currency: 'USD',
  locale: 'en-US',

  // ---- Email form -------------------------------------------------
  // Paste the form address from your email service here, for example
  // 'https://formspree.io/f/abcdwxyz'. See README.md, "Connect the email form".
  // While this is empty, the form still unlocks the results but NO
  // emails are saved anywhere (a warning appears in the browser console).
  formEndpoint: '',

  // ---- Call to action shown after someone signs up ----------------
  cta: {
    heading: 'Turn these numbers into a real plan',
    text: 'Our AgritourismSuccess.com ebooks walk you step by step through starting and growing each of these income streams on your farm.',
    buttonText: 'Browse the ebooks',
    // REPLACE with the exact address of your ebook shop page.
    buttonUrl: 'https://www.agritourismsuccess.com'
  },

  // Optional: list individual ebooks under the button. Leave the list
  // empty  ( ebooks: [] )  to show only the button above.
  // REPLACE these example entries with your real titles and links.
  ebooks: [
    // { title: 'Starting a Farm Stay', url: 'https://www.agritourismsuccess.com/...' },
    // { title: 'U-Pick Profits', url: 'https://www.agritourismsuccess.com/...' }
  ],

  // ---- Scenarios ----------------------------------------------------
  // Illustrative example, not based on data: "low" shows 70% of the
  // expected revenue and "high" shows 130%. Change if you prefer.
  scenarios: { low: 0.7, high: 1.3 },

  // ---- Sign-up wording -----------------------------------------------
  // The tick-box text people agree to. Keep it honest about what you send.
  consentText: 'Yes, add me to the AgritourismSuccess.com email list for agritourism tips and ebook offers. I can unsubscribe at any time.',
  // Short line under the button. Only promise what you actually do.
  privacyText: 'We never sell your email.',
  privacyUrl: '', // optional: link to your privacy policy page
  brandName: 'AgritourismSuccess.com'
};
