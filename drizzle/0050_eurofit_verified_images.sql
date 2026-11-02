-- Apply AFTER 0049_eurofit_catalogue.sql. Only set verified product-specific images on imported Eurofit rows.
-- No replacements of existing images; no changes to other products.
-- Correct code/description mismatches in original Eurofit import before matching images.
UPDATE catalogue_products SET name='Eurofit 110mm SV Kimberley collar', updated_at=datetime('now') WHERE upper(trim(code))='E008' AND lower(name) LIKE 'eurofit %';
--> statement-breakpoint
UPDATE catalogue_products SET name='Eurofit 110mm SV RR bent pan collar and seal plain', updated_at=datetime('now') WHERE upper(trim(code))='E011' AND lower(name) LIKE 'eurofit %';
--> statement-breakpoint
UPDATE catalogue_products SET name='Eurofit 110mm x 50mm SV eccentric reducer', updated_at=datetime('now') WHERE upper(trim(code))='E030' AND lower(name) LIKE 'eurofit %';
--> statement-breakpoint
UPDATE catalogue_products SET name='Eurofit 110mm x 50mm x 90° SV plain single reducing junction', updated_at=datetime('now') WHERE upper(trim(code))='E102' AND lower(name) LIKE 'eurofit %';
--> statement-breakpoint
UPDATE catalogue_products SET name='Eurofit 110mm x 50mm x 90° SV plain double reducing junction', updated_at=datetime('now') WHERE upper(trim(code))='E103' AND lower(name) LIKE 'eurofit %';
--> statement-breakpoint
UPDATE catalogue_products SET name='Eurofit 110mm x 50mm x 90° SV AH single reducing junction', updated_at=datetime('now') WHERE upper(trim(code))='E104' AND lower(name) LIKE 'eurofit %';
--> statement-breakpoint
UPDATE catalogue_products SET name='Eurofit 110mm x 50mm x 90° SV AH double reducing junction', updated_at=datetime('now') WHERE upper(trim(code))='E105' AND lower(name) LIKE 'eurofit %';
--> statement-breakpoint
UPDATE catalogue_products
SET image_key = 'static:https://media.leroymerlin.co.za/media/3532067/format/jpg?tr=if-iar_ne_1%2Cw-566%2Ch-566%2Ccm-pad_resize%2Cif-else%2Cw-566%2Ch-566%2Cif-end', updated_at = datetime('now')
WHERE upper(trim(code))='E073' AND lower(name) LIKE 'eurofit %' AND coalesce(image_key,'')='';
--> statement-breakpoint
UPDATE catalogue_products
SET image_key = 'static:https://www.buco.co.za/api/catalog/product/1/2/1227420_4409.jpg?image-type=image&store=default&width=600', updated_at = datetime('now')
WHERE upper(trim(code))='E030' AND lower(name) LIKE 'eurofit %' AND coalesce(image_key,'')='';
--> statement-breakpoint
UPDATE catalogue_products
SET image_key = 'static:https://d2j6dbq0eux0bg.cloudfront.net/images/128884506/products/811618011/5549314478.jpg', updated_at = datetime('now')
WHERE upper(trim(code))='E025' AND lower(name) LIKE 'eurofit %' AND coalesce(image_key,'')='';
