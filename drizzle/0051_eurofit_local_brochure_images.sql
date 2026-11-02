-- Eurofit local images extracted from TWO USER-SUPPLIED brochure pages.
-- Place public/eurofit/*.png in repository before applying migration.
-- Only match existing Eurofit-named products and never overwrite image uploads.
-- Shared illustrative photos for Masterbatts/Polycop are representative.
UPDATE catalogue_products SET image_key='static:/eurofit/E002.png', image_name='E002.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E002' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E008.png', image_name='E008.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E008' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E011.png', image_name='E011.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E011' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E012.png', image_name='E012.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E012' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E017.png', image_name='E017.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E017' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E022.png', image_name='E022.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E022' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E023.png', image_name='E023.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E023' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E027.png', image_name='E027.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E027' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E029.png', image_name='E029.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E029' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E102.png', image_name='E102.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E102' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E104.png', image_name='E104.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E104' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E103.png', image_name='E103.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E103' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E105.png', image_name='E105.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E105' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E081.png', image_name='E081.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E081' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E074.png', image_name='E074.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E074' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E073.png', image_name='E073.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E073' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E075.png', image_name='E075.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E075' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E055.png', image_name='E055.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E055' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E057.png', image_name='E057.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E057' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E058.png', image_name='E058.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E058' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E030.png', image_name='E030.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E030' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E001.png', image_name='E001.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E001' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E007.png', image_name='E007.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E007' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E024.png', image_name='E024.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E024' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E155.png', image_name='E155.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E155' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E025.png', image_name='E025.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E025' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E026.png', image_name='E026.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E026' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E020.png', image_name='E020.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E020' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E021.png', image_name='E021.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E021' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E080.png', image_name='E080.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E080' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E071.png', image_name='E071.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E071' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E070.png', image_name='E070.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E070' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E072.png', image_name='E072.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E072' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E050.png', image_name='E050.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E050' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E052.png', image_name='E052.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E052' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E140.png', image_name='E140.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E140' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E145.png', image_name='E145.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E145' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E150.png', image_name='E150.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E150' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/M501.png', image_name='M501.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='M501' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/M502.png', image_name='M502.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='M502' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/M505.png', image_name='M505.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='M505' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/M506.png', image_name='M506.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='M506' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E307.png', image_name='E307.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E307' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E308.png', image_name='E308.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E308' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E326.png', image_name='E326.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E326' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
UPDATE catalogue_products SET image_key='static:/eurofit/E327.png', image_name='E327.png', image_type='image/png', updated_at=datetime('now') WHERE upper(trim(code))='E327' AND lower(name) LIKE 'eurofit %' AND (coalesce(image_key,'')='' OR image_key LIKE 'static:http%');
--> statement-breakpoint
