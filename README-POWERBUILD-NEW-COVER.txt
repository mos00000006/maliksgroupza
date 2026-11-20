POWERBUILD HUB – CATALOGUE COVER (PAGE 1) PATCH

What this changes
- Replaces only the dynamic PowerBuild Wholesale Catalogue cover artwork (PDF page 1).
- Top cover scene: person using an orange heavy-duty hacksaw, based on the supplied product reference.
- Bottom cover scene: tiler applying tile adhesive, with a Power Gripp Porcelain 24 bag, based on the supplied reference.
- Navy (#0A2A3F) and gold (#D4A017) branding with the original PowerBuild logo artwork.
- Existing Company Profile stays at page 2; products and page numbers are unaffected.

File replacement
  public/wholesale-division-cover-v2.png

Codespaces instructions
1. Upload this ZIP into /workspaces/maliksgroupza.
2. From repository root run:
   unzip -o PowerBuild_Hub_New_Catalogue_Cover_Page1_Patch.zip
   git add public/wholesale-division-cover-v2.png
   git commit -m "Refresh PowerBuild catalogue cover with product action photos"
   git push origin main
3. Run Deploy Maliks Group Hub workflow and verify Hub > Our Catalogue > Download Wholesale Division PDF.

No code changes or migrations required; the existing PDF generator reads the cover file by this exact path.
This does not modify 'Download original PDF' which points to a separate historical file.

Important: The action photographs are illustrative generated marketing artwork using your uploaded product photos as references. The original PowerBuild logo has been used exactly. Verify marketing depiction against actual merchandise before publishing.
