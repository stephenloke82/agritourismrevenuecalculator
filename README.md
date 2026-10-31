# Agritourism Revenue Calculator

A free calculator for farm owners. They pick the ways they could welcome visitors
(farm stays, u-pick, events and weddings, tours, a farm stand, seasonal attractions,
or their own idea), type in their own numbers, and see what it could earn in a year.

It is also a **lead magnet** for AgritourismSuccess.com:

- Everyone sees the **estimated yearly revenue** for free.
- To see the **profit after costs, the breakdown by stream with a chart, and the
  low / expected / high scenarios**, they enter their first name and email and tick
  a consent box.
- After that they see a button to your ebooks.

It is a plain web page (HTML, CSS and JavaScript). There is nothing to install, no
server and no monthly cost. GitHub hosts it for free, and you show it on your Wix
site in an "Embed a site" box.

---

## What is in this folder

| File | What it is | Do you edit it? |
|---|---|---|
| `config.js` | **All your settings**: currency, email form address, ebook button text and links, sign-up wording | **Yes, this is the one** |
| `index.html` | The page itself | Rarely |
| `css/styles.css` | Colours and layout | Only if you want a different look |
| `js/calculator.js` | The maths and the starting example numbers | Only to change the example numbers |
| `js/app.js` | Makes the page work (live updates, the form) | No |
| `tests/` | Automatic checks of the maths, and a test page | No |

---

## Step 1: Put the calculator online with GitHub Pages (about 5 minutes)

You only do this once.

1. Make sure the pull request with this calculator has been **merged** into the
   `main` branch (on GitHub: open the pull request, click **Merge pull request**,
   then **Confirm merge**).
2. On GitHub, open this repository:
   `https://github.com/stephenloke82/agritourismrevenuecalculator`
3. Click **Settings** (the tab with the gear icon, near the top).
4. In the left-hand menu, click **Pages**.
5. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
6. Under **Branch**, choose **main** and **/ (root)**, then click **Save**.
7. Wait one to two minutes, then refresh the page. A box appears at the top saying
   *"Your site is live at …"*. Your calculator address will be:

   **https://stephenloke82.github.io/agritourismrevenuecalculator/**

8. Open that address on your computer and on your phone to check it works.

> If you don't see the **Pages** option or it says you need to upgrade: on a free
> GitHub account the repository must be **public**. Go to **Settings → General**,
> scroll to the bottom (**Danger Zone**), click **Change visibility** and choose
> **Public**. Nothing secret is stored in this project, so that is safe.

Every time you change a file on `main` (for example `config.js`), GitHub updates the
live page by itself within a minute or two.

---

## Step 2: Show it on your Wix site

These steps are for the classic **Wix Editor**, taken from Wix's help article
[Embedding a Site or a Widget](https://support.wix.com/en/article/wix-editor-embedding-a-site-or-a-widget).
If you use Wix Studio or the newer Wix Harmony editor the menu names differ a little; see
[Studio](https://support.wix.com/en/article/studio-editor-adding-an-html-iframe-element)
or [Harmony](https://support.wix.com/en/article/wix-harmony-editor-embedding-a-link-or-html-code).

1. Open your site in the Wix Editor and go to the page where the calculator should go
   (a new page called "Revenue Calculator" works well).
2. Click **Add Elements** (the **+** on the left).
3. Click **Embed Code**, then **Popular Embeds**, then **Embed a site**.
4. Click the new box on your page, then click **Enter Website Address**.
5. Paste your calculator address:
   `https://stephenloke82.github.io/agritourismrevenuecalculator/`
   and click **Apply**.
6. **Make the box big enough.** Drag the box to the full width of your page, then drag
   its bottom edge down. A good starting height is about **1,400 pixels** on desktop.
   If the calculator is taller than the box, visitors can scroll inside it, so nothing
   is ever cut off.
7. **Check the phone version.** Click the phone icon at the top of the editor to switch
   to the mobile view. Click the box and set its height to roughly one phone screen
   (about **700 to 800 pixels**). On phones the calculator shows a small green bar at
   the bottom with the running total, so visitors always see the number change while
   they type.
8. Click **Preview** to try it, then **Publish**.

**About the height:** Wix's "Embed a site" box has a fixed height that you set by
hand. The calculator also announces its own height to the page around it, so if you
ever embed it on a website that can listen for that (see `tests/iframe-host.html` for
an example), the box can grow and shrink by itself. The normal Wix box does not do
this, which is why step 6 asks you to set the height yourself.

---

## Step 3: Connect the email form (so you actually collect the emails)

**Right now no emails are saved.** Until you do this step, the form still unlocks the
results for visitors (so the calculator works), but the name and email go nowhere.

You need a free "form backend": a service that receives the form and stores the
entries or forwards them to your email. The simplest option that works with this kind
of page is **Formspree** (formspree.io). Check its website for the current free-plan
limits before you decide. Any service that gives you a form address that accepts
a normal web form "POST" will also work.

### With Formspree

1. Go to **formspree.io** and create a free account.
2. Click **New Form** (or **+ New Project**, then **New Form**). Name it
   "Revenue Calculator".
3. Formspree shows your form's address. It looks like
   `https://formspree.io/f/abcdwxyz`. Copy it.
4. On GitHub, open `config.js` in this repository and click the **pencil icon**
   (Edit this file).
5. Find this line:

   ```js
   formEndpoint: '',
   ```

   and paste your address between the two quote marks:

   ```js
   formEndpoint: 'https://formspree.io/f/abcdwxyz',
   ```

6. Click **Commit changes…**, then **Commit changes** again.
7. Wait two minutes, open your calculator, and sign up with your own email to test it.
   Formspree may ask you to confirm the first submission by email.

Each sign-up sends you: name, email, the consent wording they agreed to, their estimated
yearly revenue and profit, and which income streams they switched on. That last part
tells you which ebook to recommend to each person.

### Getting the emails into your email list

Formspree stores the sign-ups. To send newsletters you will want them in an email
marketing service (for example MailerLite, Kit, Mailchimp or Wix's own email marketing).
You can export the list from Formspree as a spreadsheet and import it, or use one of
Formspree's built-in connections if it offers one for your service.

### Please also

- Add a link to your **privacy policy**: put its address in `privacyUrl` in `config.js`.
- Only send what the tick box says. The wording is in `consentText` in `config.js`;
  change it if you plan to send something different.

> **Never paste passwords or secret API keys into `config.js`.** Everyone can read it.
> A Formspree form address is fine: it is meant to be public.

---

## Changing words, links and money settings

Everything is in **`config.js`**. Edit it on GitHub with the pencil icon, change the
text between the quote marks, and commit. Keep the quote marks and the commas.

- **Currency:** `currency: 'USD'`. Use `'CAD'`, `'GBP'`, `'EUR'`, `'AUD'` etc.
  Also change `locale` to match (for example `'en-GB'` for pounds, `'en-CA'` for
  Canadian dollars).
- **Ebook button:** the `cta` section (heading, text, button words and button link).
  **Replace `buttonUrl` with the exact address of your ebook shop page.**
- **List of ebooks (optional):** add lines to `ebooks`, for example
  `{ title: 'Starting a Farm Stay', url: 'https://www.agritourismsuccess.com/...' },`
- **Low / high scenarios:** `scenarios: { low: 0.7, high: 1.3 }` means 70% and 130%
  of the expected revenue.

### About the starting numbers

All the numbers people see when the page first opens (prices, visitor counts, days
open, cost percentages, and the 70% / 130% scenarios) are **made-up examples** so the
page shows something sensible. They are not industry averages or survey results, and
the page tells visitors to replace them. If you want different starting numbers, they
are in `js/calculator.js`; each one is marked `// illustrative example`. If you swap
in a real statistic, add a comment saying where it came from.

---

## Trying it on your own computer

Double-click `index.html` to open it in your web browser. Everything works except
saving emails to a real service.

## For developers

- No build step and no dependencies. The page loads `config.js`, `js/calculator.js`
  and `js/app.js` as plain scripts.
- Tests for the maths: install Node.js 18 or newer, then run `node --test` (or
  `npm test`) in this folder.
- The form posts `multipart/form-data` with `Accept: application/json`. If the endpoint
  is empty, it logs a console warning and unlocks the results. If the post fails, it
  logs an error and still unlocks them, so a visitor is never stuck.
- Iframe height: the page sends
  `postMessage({ type: 'agritourism-calculator:height', height })` to its parent
  whenever its height changes. `tests/iframe-host.html` shows a host page that listens.
- Visitors' inputs and their unlocked status are remembered in the browser
  (`localStorage`) when the browser allows it.
