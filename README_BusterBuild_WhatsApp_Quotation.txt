BUSTER BUILD / POWERBUILD HARDWARE / MALIKS PAINT & HARDWARE
WhatsApp Pamphlet Quotation System — 23 November 2026

FILES
-----
1) pamphlet-quote.html
   One self-contained HTML file with all CSS, JavaScript, embedded branding,
   pictures of the four flyer pages, searchable products, quotation basket,
   order form, salesperson picker, WhatsApp link and local browser history.

2) BusterBuild_White_QR_for_Pamphlet.png
   White QR modules on TRANSPARENT background, high resolution. Place over
   a solid very dark/black square with adequate space around the edges.
   IMPORTANT: Some phones do not reliably scan inverted white QR codes.
   Always test the QR on the final printed design with several phones.

3) BusterBuild_White_QR_for_Pamphlet.svg
   Vector version for your pamphlet designer. White shapes, transparent background.

4) BusterBuild_Black_on_White_QR.png
   STANDARD black-on-white fallback. Verified with a QR decoder, recommended
   wherever reliable scan performance is more important than the white styling.

5) BusterBuild_QR_Dark_Background_Preview.png
   Example placement only. Not suitable as the production QR by itself.

EDIT THE SALESPEOPLE
--------------------
Open pamphlet-quote.html in VS Code or Notepad++ and search for:
   const SALESPEOPLE=[
Replace the placeholder objects with real confirmed salespeople, e.g.:
   const SALESPEOPLE=[
     {id:'rakesh',name:'Rakesh Sobaram',phone:'0795122078',photo:'',role:'Sales Consultant'},
     {id:'person2',name:'Second Person',phone:'0821234567',photo:'https://example.com/photo.jpg',role:'Sales Consultant'}
   ];
The sample above is FORMATTING ONLY, not a verified staff roster or authorised recipient.
Don't publish the sample until you've verified each name and WhatsApp number.
Photo field accepts a public HTTPS image URL or an embedded data:image/... value.
If photo is empty, a clean initials avatar is displayed.

EDIT THE BRAND / DOMAIN
-----------------------
Find:
   const CONFIG={
The page uses Buster Build as the retail-facing name because the attached
pamphlet is Buster Build-branded. Group brand is PowerBuild / Maliks.

QR TARGET — CRITICAL
--------------------
Both supplied QR files encode the PROPOSED URL:
   https://maliks.co.za/pamphlet-quote.html
This address is NOT confirmed to host the new form yet. Do not print the
QR until the file is published at EXACTLY this publicly accessible URL.

To publish:
  1. Upload pamphlet-quote.html to your website server/host so it opens at
     https://maliks.co.za/pamphlet-quote.html
     (If your website runs through Cloudflare Workers, you must add a route
      serving that file. Just adding the file on your computer isn't enough.)
  2. Test that URL on your phone, without signing in.
  3. Scan the supplied QR. Verify it opens the quotation page.
  4. Only then add the QR artwork to the sales pamphlet and print.

If you host at a DIFFERENT URL, the QR MUST be regenerated for that address.
Changing CONFIG.PAGE_URL alone does not change the supplied QR image.

WHATSAPP BEHAVIOR
-----------------
The page opens WhatsApp addressed to the chosen salesperson, with a ready-made
quotation REQUEST message. The customer has to tap Send in WhatsApp.
A browser cannot silently send WhatsApp messages without using an authorised
WhatsApp Business Platform integration.

STORAGE LIMITATION
------------------
Every successful "open WhatsApp" attempt is saved to localStorage on the
CUSTOMER'S CURRENT BROWSER/DEVICE (Saved requests -> Export CSV). It is
not a shared online database and managers cannot see orders from other
customers' phones. To manage ALL orders centrally, connect a secure backend
(such as your Cloudflare Worker/D1 system) with authenticated staff dashboards.
Do not treat a locally saved request as a message actually sent in WhatsApp.

WHAT'S IN THE PRODUCT LIST
--------------------------
105 selectable pamphlet lines, including pack-size/length variants, and six
advertised services, transcribed from the supplied four-page Buster Build
pamphlet. Customer can add unlisted products such as bricks or specialised
plumbing fittings with quantities in the 'Can't find what you need?' box.
Flyer promotional prices are shown for reference only; the WhatsApp message
requests confirmation from the salesperson. Promotion dates shown in the flyer
are 25 November - 15 December 2026. Subject to availability and E&OE.

TESTING PERFORMED
-----------------
- Chromium desktop/mobile smoke tests: 105 product cards, responsive layout.
- Search and +/- quantity changes.
- Custom items and delivery/collection address behavior.
- Salesperson phone conversion 0795122078 => 27795122078.
- Quotation WhatsApp text formatting and customer form validation.
- Standard black-on-white QR decoded to the proposed URL.
- White inverse QR may require compatible scanner; test on final background.

SUGGESTION
----------
For launch, set confirmed salesperson numbers, publish page, test QR on a real
phone, and consider connecting the quotation data to your Hub for central reports.
