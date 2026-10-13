-- Import of all product content represented in the original PowerBuild wholesale catalogue PDF.
-- Static product images are bundled under public/wholesale-products and served directly by the Hub.

INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-01','FITTING COMP HDPE 90DEG ELBOW 20MM','FITTING COMP HDPE 90DEG ELBOW 20MM','Plumbing','p02-01.jpg','image/jpeg',43404,'static:/wholesale-products/p02-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-01.jpg', image_type='image/jpeg', image_size=43404, image_key='static:/wholesale-products/p02-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-01' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-02','FITTING COMP HDPE MALE THREAD ADAPTOR 20X1/2','FITTING COMP HDPE MALE THREAD ADAPTOR 20X1/2','Plumbing','p02-02.jpg','image/jpeg',41412,'static:/wholesale-products/p02-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-02.jpg', image_type='image/jpeg', image_size=41412, image_key='static:/wholesale-products/p02-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-02' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-03','FITTING COMP HDPE FEMALE THREAD ADAPTOR 20X1/2','FITTING COMP HDPE FEMALE THREAD ADAPTOR 20X1/2','Plumbing','p02-03.jpg','image/jpeg',52108,'static:/wholesale-products/p02-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-03.jpg', image_type='image/jpeg', image_size=52108, image_key='static:/wholesale-products/p02-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-03' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-04','FITTING COMP HDPE REDUCING COUPLING 20X25MM','FITTING COMP HDPE REDUCING COUPLING 20X25MM','Plumbing','p02-04.jpg','image/jpeg',51534,'static:/wholesale-products/p02-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-04.jpg', image_type='image/jpeg', image_size=51534, image_key='static:/wholesale-products/p02-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-04' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-05','FITTING COMP HDPE EQUAL TEE 20MM','FITTING COMP HDPE EQUAL TEE 20MM','Plumbing','p02-05.jpg','image/jpeg',46114,'static:/wholesale-products/p02-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-05.jpg', image_type='image/jpeg', image_size=46114, image_key='static:/wholesale-products/p02-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-05' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-06','FITTING COMP HDPE MALE THREAD ADAPTOR 20X3/4','FITTING COMP HDPE MALE THREAD ADAPTOR 20X3/4','Plumbing','p02-06.jpg','image/jpeg',40138,'static:/wholesale-products/p02-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-06.jpg', image_type='image/jpeg', image_size=40138, image_key='static:/wholesale-products/p02-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-06' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-07','FITTING COMP HDPE END CAP 20MM','FITTING COMP HDPE END CAP 20MM','Plumbing','p02-07.jpg','image/jpeg',45501,'static:/wholesale-products/p02-07.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-07.jpg', image_type='image/jpeg', image_size=45501, image_key='static:/wholesale-products/p02-07.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-07' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-08','FITTING COMP HDPE REDUCING TEE 25X20MM','FITTING COMP HDPE REDUCING TEE 25X20MM','Plumbing','p02-08.jpg','image/jpeg',34401,'static:/wholesale-products/p02-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-08.jpg', image_type='image/jpeg', image_size=34401, image_key='static:/wholesale-products/p02-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-08' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-09','FITTING COMP HDPE BALL VALVE 20MM','FITTING COMP HDPE BALL VALVE 20MM','Plumbing','p02-09.jpg','image/jpeg',43282,'static:/wholesale-products/p02-09.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-09.jpg', image_type='image/jpeg', image_size=43282, image_key='static:/wholesale-products/p02-09.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-09' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-10','FITTING COMP HDPE COUPLING 20MM','FITTING COMP HDPE COUPLING 20MM','Plumbing','p02-10.jpg','image/jpeg',45865,'static:/wholesale-products/p02-10.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-10.jpg', image_type='image/jpeg', image_size=45865, image_key='static:/wholesale-products/p02-10.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-11','W 40MMX45 DEG PLAIN BEND SABS','W 40MMX45 DEG PLAIN BEND SABS','Plumbing','p02-11.jpg','image/jpeg',22453,'static:/wholesale-products/p02-11.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-11.jpg', image_type='image/jpeg', image_size=22453, image_key='static:/wholesale-products/p02-11.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-11' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-12','W 40MMX45 DEG IE BEND SABS','W 40MMX45 DEG IE BEND SABS','Plumbing','p02-12.jpg','image/jpeg',26939,'static:/wholesale-products/p02-12.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-12.jpg', image_type='image/jpeg', image_size=26939, image_key='static:/wholesale-products/p02-12.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-12' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-13','W 40MMX90 DEG PLAIN JUNCTION SABS','W 40MMX90 DEG PLAIN JUNCTION SABS','Plumbing','p02-13.jpg','image/jpeg',26308,'static:/wholesale-products/p02-13.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-13.jpg', image_type='image/jpeg', image_size=26308, image_key='static:/wholesale-products/p02-13.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-13' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-14','W 50MMX90 DEG PLAIN BEND SABS','W 50MMX90 DEG PLAIN BEND SABS','Plumbing','p02-14.jpg','image/jpeg',26905,'static:/wholesale-products/p02-14.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-14.jpg', image_type='image/jpeg', image_size=26905, image_key='static:/wholesale-products/p02-14.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-14' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-15','W 40MMX90 DEG IE BEND SABS','W 40MMX90 DEG IE BEND SABS','Plumbing','p02-15.jpg','image/jpeg',36280,'static:/wholesale-products/p02-15.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-15.jpg', image_type='image/jpeg', image_size=36280, image_key='static:/wholesale-products/p02-15.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-16','W 50MMX90 DEG IE BEND','W 50MMX90 DEG IE BEND','Plumbing','p02-16.jpg','image/jpeg',22434,'static:/wholesale-products/p02-16.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-16.jpg', image_type='image/jpeg', image_size=22434, image_key='static:/wholesale-products/p02-16.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-16' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-17','W 50MMX45 DEG PLAIN BEND','W 50MMX45 DEG PLAIN BEND','Plumbing','p02-17.jpg','image/jpeg',20936,'static:/wholesale-products/p02-17.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-17.jpg', image_type='image/jpeg', image_size=20936, image_key='static:/wholesale-products/p02-17.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-17' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-18','W 50MMX45 DEG IE BEND','W 50MMX45 DEG IE BEND','Plumbing','p02-18.jpg','image/jpeg',26394,'static:/wholesale-products/p02-18.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-18.jpg', image_type='image/jpeg', image_size=26394, image_key='static:/wholesale-products/p02-18.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-18' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-19','W 50MMX90 DEG PLAIN T JUNCTION','W 50MMX90 DEG PLAIN T JUNCTION','Plumbing','p02-19.jpg','image/jpeg',25605,'static:/wholesale-products/p02-19.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-19.jpg', image_type='image/jpeg', image_size=25605, image_key='static:/wholesale-products/p02-19.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-19' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-21','W 50MMX90 DEG IE BEND SABS','W 50MMX90 DEG IE BEND SABS','Plumbing','p02-21.jpg','image/jpeg',33802,'static:/wholesale-products/p02-21.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-21.jpg', image_type='image/jpeg', image_size=33802, image_key='static:/wholesale-products/p02-21.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-21' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-22','W 50MMX45 DEG PLAIN BEND SABS','W 50MMX45 DEG PLAIN BEND SABS','Plumbing','p02-22.jpg','image/jpeg',30888,'static:/wholesale-products/p02-22.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-22.jpg', image_type='image/jpeg', image_size=30888, image_key='static:/wholesale-products/p02-22.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-22' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-23','W 50MMX45 DEG PLAIN JUNCTION SABS','W 50MMX45 DEG PLAIN JUNCTION SABS','Plumbing','p02-23.jpg','image/jpeg',30353,'static:/wholesale-products/p02-23.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-23.jpg', image_type='image/jpeg', image_size=30353, image_key='static:/wholesale-products/p02-23.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-23' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-24','W 50MMX45 DEG IE JUNCTION SABS','W 50MMX45 DEG IE JUNCTION SABS','Plumbing','p02-24.jpg','image/jpeg',29467,'static:/wholesale-products/p02-24.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-24.jpg', image_type='image/jpeg', image_size=29467, image_key='static:/wholesale-products/p02-24.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-24' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P02-25','W45MMX90 DEG PLAIN BEND SABS','W45MMX90 DEG PLAIN BEND SABS','Plumbing','p02-25.jpg','image/jpeg',34694,'static:/wholesale-products/p02-25.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p02-25.jpg', image_type='image/jpeg', image_size=34694, image_key='static:/wholesale-products/p02-25.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P02-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-01','PIPE UG 110MMX6M','PIPE UG 110MMX6M','Plumbing','p03-01.jpg','image/jpeg',19089,'static:/wholesale-products/p03-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-01.jpg', image_type='image/jpeg', image_size=19089, image_key='static:/wholesale-products/p03-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-01' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-02','PIPE WASTE 50MMX6M','PIPE WASTE 50MMX6M','Plumbing','p03-02.jpg','image/jpeg',9893,'static:/wholesale-products/p03-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-02.jpg', image_type='image/jpeg', image_size=9893, image_key='static:/wholesale-products/p03-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-02' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-03','PIPE HDPE 20MMX100M C10','PIPE HDPE 20MMX100M C10','Plumbing','p03-03.jpg','image/jpeg',57434,'static:/wholesale-products/p03-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-03.jpg', image_type='image/jpeg', image_size=57434, image_key='static:/wholesale-products/p03-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-03' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-04','PIPE POLYCORP 15MMX100M','PIPE POLYCORP 15MMX100M','Plumbing','p03-04.jpg','image/jpeg',84619,'static:/wholesale-products/p03-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-04.jpg', image_type='image/jpeg', image_size=84619, image_key='static:/wholesale-products/p03-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-04' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-05','PIPE SV 110MMX6M','PIPE SV 110MMX6M','Plumbing','p03-05.jpg','image/jpeg',65027,'static:/wholesale-products/p03-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-05.jpg', image_type='image/jpeg', image_size=65027, image_key='static:/wholesale-products/p03-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-05' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-06','UG 110MMX90 DEG LONG RADIUS BEND','UG 110MMX90 DEG LONG RADIUS BEND','Plumbing','p03-06.jpg','image/jpeg',34615,'static:/wholesale-products/p03-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-06.jpg', image_type='image/jpeg', image_size=34615, image_key='static:/wholesale-products/p03-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-06' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-07','UG 110MMX22.5 DEG PLAIN BEND','UG 110MMX22.5 DEG PLAIN BEND','Plumbing','p03-07.jpg','image/jpeg',40266,'static:/wholesale-products/p03-07.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-07.jpg', image_type='image/jpeg', image_size=40266, image_key='static:/wholesale-products/p03-07.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-07' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-08','UG 110MMX45 DEG PLAIN Y JUNCTION','UG 110MMX45 DEG PLAIN Y JUNCTION','Plumbing','p03-08.jpg','image/jpeg',41386,'static:/wholesale-products/p03-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-08.jpg', image_type='image/jpeg', image_size=41386, image_key='static:/wholesale-products/p03-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-08' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-09','UG 110MM DEG PLAIN Y JUNCTION','UG 110MM DEG PLAIN Y JUNCTION','Plumbing','p03-09.jpg','image/jpeg',37147,'static:/wholesale-products/p03-09.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-09.jpg', image_type='image/jpeg', image_size=37147, image_key='static:/wholesale-products/p03-09.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-09' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-10','UG 110MM SINGLE SOCKET','UG 110MM SINGLE SOCKET','Plumbing','p03-10.jpg','image/jpeg',32732,'static:/wholesale-products/p03-10.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-10.jpg', image_type='image/jpeg', image_size=32732, image_key='static:/wholesale-products/p03-10.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-11','SV 110MMX45 DEG PLAIN BEND','SV 110MMX45 DEG PLAIN BEND','Plumbing','p03-11.jpg','image/jpeg',25234,'static:/wholesale-products/p03-11.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-11.jpg', image_type='image/jpeg', image_size=25234, image_key='static:/wholesale-products/p03-11.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-11' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-12','SV 110MMX90 DEG IT T JUNCTION','SV 110MMX90 DEG IT T JUNCTION','Plumbing','p03-12.jpg','image/jpeg',35597,'static:/wholesale-products/p03-12.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-12.jpg', image_type='image/jpeg', image_size=35597, image_key='static:/wholesale-products/p03-12.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-12' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-13','SV 110MM FLEXIBLE PAN CONNECTOR 50MM','SV 110MM FLEXIBLE PAN CONNECTOR 50MM','Plumbing','p03-13.jpg','image/jpeg',25832,'static:/wholesale-products/p03-13.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-13.jpg', image_type='image/jpeg', image_size=25832, image_key='static:/wholesale-products/p03-13.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-13' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-14','SV 110M KIMBERLEY SOCKET','SV 110M KIMBERLEY SOCKET','Plumbing','p03-14.jpg','image/jpeg',28860,'static:/wholesale-products/p03-14.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-14.jpg', image_type='image/jpeg', image_size=28860, image_key='static:/wholesale-products/p03-14.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-14' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-15','SV 110MX90 DEG PLAIN BEND','SV 110MX90 DEG PLAIN BEND','Plumbing','p03-15.jpg','image/jpeg',26517,'static:/wholesale-products/p03-15.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-15.jpg', image_type='image/jpeg', image_size=26517, image_key='static:/wholesale-products/p03-15.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-16','PAN SEAL RING BROWN BOX','PAN SEAL RING BROWN BOX','Plumbing','p03-16.jpg','image/jpeg',49019,'static:/wholesale-products/p03-16.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-16.jpg', image_type='image/jpeg', image_size=49019, image_key='static:/wholesale-products/p03-16.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-16' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-17','TRAP WASTE P 30X40 BLACK','TRAP WASTE P 30X40 BLACK','Plumbing','p03-17.jpg','image/jpeg',30675,'static:/wholesale-products/p03-17.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-17.jpg', image_type='image/jpeg', image_size=30675, image_key='static:/wholesale-products/p03-17.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-17' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-18','TRAP WASTE BATH MINI 40X40 BLACK','TRAP WASTE BATH MINI 40X40 BLACK','Plumbing','p03-18.jpg','image/jpeg',22646,'static:/wholesale-products/p03-18.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-18.jpg', image_type='image/jpeg', image_size=22646, image_key='static:/wholesale-products/p03-18.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-18' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-19','MASTERBATT 15MM','MASTERBATT 15MM','Plumbing','p03-19.jpg','image/jpeg',46168,'static:/wholesale-products/p03-19.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-19.jpg', image_type='image/jpeg', image_size=46168, image_key='static:/wholesale-products/p03-19.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-19' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-20','TAPE PLUMBERS 12MMX10M','TAPE PLUMBERS 12MMX10M','Plumbing','p03-20.jpg','image/jpeg',26760,'static:/wholesale-products/p03-20.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-20.jpg', image_type='image/jpeg', image_size=26760, image_key='static:/wholesale-products/p03-20.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-20' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-21','HOSE CONNECTOR','HOSE CONNECTOR - BRAIDED F3/4XF3/4 35CM; NYLON BRAIDED F1/2XF1/2 35CM; HOSE CONNECTOR NYLO (wording as shown in source catalogue).','Plumbing','p03-21.jpg','image/jpeg',55232,'static:/wholesale-products/p03-21.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-21.jpg', image_type='image/jpeg', image_size=55232, image_key='static:/wholesale-products/p03-21.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-21' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-22','PIPE COMPOSITE ALU PEX 110X5MMX100M','PIPE COMPOSITE ALU PEX 110X5MMX100M','Plumbing','p03-22.jpg','image/jpeg',30858,'static:/wholesale-products/p03-22.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-22.jpg', image_type='image/jpeg', image_size=30858, image_key='static:/wholesale-products/p03-22.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-22' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P03-23','STANDPIPE GALVANIZED 1/2"','STANDPIPE GALVANIZED 1/2"','Plumbing','p03-23.jpg','image/jpeg',59847,'static:/wholesale-products/p03-23.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p03-23.jpg', image_type='image/jpeg', image_size=59847, image_key='static:/wholesale-products/p03-23.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P03-23' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-01','FITTING COMP COPPER 90D ELBOW 15MM','FITTING COMP COPPER 90D ELBOW 15MM','Plumbing','p04-01.jpg','image/jpeg',56108,'static:/wholesale-products/p04-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-01.jpg', image_type='image/jpeg', image_size=56108, image_key='static:/wholesale-products/p04-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-01' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-02','FITTING COMP COPPER STRAIGHT COUPLER 15MM','FITTING COMP COPPER STRAIGHT COUPLER 15MM','Plumbing','p04-02.jpg','image/jpeg',45758,'static:/wholesale-products/p04-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-02.jpg', image_type='image/jpeg', image_size=45758, image_key='static:/wholesale-products/p04-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-02' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-03','FITTING COMP COPPER SADDLE 15MM','FITTING COMP COPPER SADDLE 15MM','Plumbing','p04-03.jpg','image/jpeg',31060,'static:/wholesale-products/p04-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-03.jpg', image_type='image/jpeg', image_size=31060, image_key='static:/wholesale-products/p04-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-03' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-04','FITTING COMP COPPER EQUAL TEE 15MM','FITTING COMP COPPER EQUAL TEE 15MM','Plumbing','p04-04.jpg','image/jpeg',39505,'static:/wholesale-products/p04-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-04.jpg', image_type='image/jpeg', image_size=39505, image_key='static:/wholesale-products/p04-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-04' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-05','FITTING COMP COPPER FITTINGS REDUCING COUPLER 20X15','FITTING COMP COPPER FITTINGS REDUCING COUPLER 20X15','Plumbing','p04-05.jpg','image/jpeg',58326,'static:/wholesale-products/p04-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-05.jpg', image_type='image/jpeg', image_size=58326, image_key='static:/wholesale-products/p04-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-05' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-06','FITTING COMP COPPER CAP 15MM','FITTING COMP COPPER CAP 15MM','Plumbing','p04-06.jpg','image/jpeg',48641,'static:/wholesale-products/p04-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-06.jpg', image_type='image/jpeg', image_size=48641, image_key='static:/wholesale-products/p04-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-06' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-07','FITTING COMP COPPER 90D ELBOW 22MM','FITTING COMP COPPER 90D ELBOW 22MM','Plumbing','p04-07.jpg','image/jpeg',55065,'static:/wholesale-products/p04-07.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-07.jpg', image_type='image/jpeg', image_size=55065, image_key='static:/wholesale-products/p04-07.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-07' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-08','FITTING COMP COPPER STRAIGHT COUPLER 22MM','FITTING COMP COPPER STRAIGHT COUPLER 22MM','Plumbing','p04-08.jpg','image/jpeg',41721,'static:/wholesale-products/p04-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-08.jpg', image_type='image/jpeg', image_size=41721, image_key='static:/wholesale-products/p04-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-08' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-09','FITTING COMP COPPER EQUAL TEE 22MM','FITTING COMP COPPER EQUAL TEE 22MM','Plumbing','p04-09.jpg','image/jpeg',60345,'static:/wholesale-products/p04-09.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-09.jpg', image_type='image/jpeg', image_size=60345, image_key='static:/wholesale-products/p04-09.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-09' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-10','FITTING COMP COPPER SADDLE 22MM','FITTING COMP COPPER SADDLE 22MM','Plumbing','p04-10.jpg','image/jpeg',31276,'static:/wholesale-products/p04-10.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-10.jpg', image_type='image/jpeg', image_size=31276, image_key='static:/wholesale-products/p04-10.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-11','FITTING COMP BRASS RING 15MM','FITTING COMP BRASS RING 15MM','Plumbing','p04-11.jpg','image/jpeg',37910,'static:/wholesale-products/p04-11.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-11.jpg', image_type='image/jpeg', image_size=37910, image_key='static:/wholesale-products/p04-11.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-11' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-12','FITTING COMP BRASS STRAIGHT COUPLER CxMI 15MMX1/2','FITTING COMP BRASS STRAIGHT COUPLER CxMI 15MMX1/2','Plumbing','p04-12.jpg','image/jpeg',63579,'static:/wholesale-products/p04-12.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-12.jpg', image_type='image/jpeg', image_size=63579, image_key='static:/wholesale-products/p04-12.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-12' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-13','FITTING COMP BRASS STRAIGHT COUPLER CxC 15MM','FITTING COMP BRASS STRAIGHT COUPLER CxC 15MM','Plumbing','p04-13.jpg','image/jpeg',73744,'static:/wholesale-products/p04-13.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-13.jpg', image_type='image/jpeg', image_size=73744, image_key='static:/wholesale-products/p04-13.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-13' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-14','FITTING COMP BRASS TEE CxCxC 15MM','FITTING COMP BRASS TEE CxCxC 15MM','Plumbing','p04-14.jpg','image/jpeg',76448,'static:/wholesale-products/p04-14.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-14.jpg', image_type='image/jpeg', image_size=76448, image_key='static:/wholesale-products/p04-14.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-14' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-15','FITTING COMP BRASS ELBOW CxC 15MM','FITTING COMP BRASS ELBOW CxC 15MM','Plumbing','p04-15.jpg','image/jpeg',76105,'static:/wholesale-products/p04-15.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-15.jpg', image_type='image/jpeg', image_size=76105, image_key='static:/wholesale-products/p04-15.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-16','FITTING COMP BRASS DELCOP 15MM 1/2 FI COUPLER','FITTING COMP BRASS DELCOP 15MM 1/2 FI COUPLER','Plumbing','p04-16.jpg','image/jpeg',86224,'static:/wholesale-products/p04-16.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-16.jpg', image_type='image/jpeg', image_size=86224, image_key='static:/wholesale-products/p04-16.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-16' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-17','FITTING COMP BRASS DELCOP 15MM 1/2 MI COUPLER','FITTING COMP BRASS DELCOP 15MM 1/2 MI COUPLER','Plumbing','p04-17.jpg','image/jpeg',69210,'static:/wholesale-products/p04-17.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-17.jpg', image_type='image/jpeg', image_size=69210, image_key='static:/wholesale-products/p04-17.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-17' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-18','FITTING COMP BRASS DELCOP 15MM 1/2 FI TEE','FITTING COMP BRASS DELCOP 15MM 1/2 FI TEE','Plumbing','p04-18.jpg','image/jpeg',72287,'static:/wholesale-products/p04-18.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-18.jpg', image_type='image/jpeg', image_size=72287, image_key='static:/wholesale-products/p04-18.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-18' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-19','FITTINGS GALVANIZED 90 DEG ELBOW','FITTINGS GALVANIZED 90 DEG ELBOW','Plumbing','p04-19.jpg','image/jpeg',57297,'static:/wholesale-products/p04-19.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-19.jpg', image_type='image/jpeg', image_size=57297, image_key='static:/wholesale-products/p04-19.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-19' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-20','FITTINGS GALVANIZED 270 SOCKET 1/2 INCH','FITTINGS GALVANIZED 270 SOCKET 1/2 INCH','Plumbing','p04-20.jpg','image/jpeg',64567,'static:/wholesale-products/p04-20.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-20.jpg', image_type='image/jpeg', image_size=64567, image_key='static:/wholesale-products/p04-20.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-20' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-21','FITTINGS GALVANIZED BARREL NIPPLE 1/2X2INCH','FITTINGS GALVANIZED BARREL NIPPLE 1/2X2INCH','Plumbing','p04-21.jpg','image/jpeg',80470,'static:/wholesale-products/p04-21.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-21.jpg', image_type='image/jpeg', image_size=80470, image_key='static:/wholesale-products/p04-21.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-21' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-22','FITTINGS GALVANIZED 290 PLUG 1/2 INCH','FITTINGS GALVANIZED 290 PLUG 1/2 INCH','Plumbing','p04-22.jpg','image/jpeg',59412,'static:/wholesale-products/p04-22.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-22.jpg', image_type='image/jpeg', image_size=59412, image_key='static:/wholesale-products/p04-22.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-22' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P04-23','COPPER PIPE','COPPER PIPE','Plumbing','p04-23.jpg','image/jpeg',62418,'static:/wholesale-products/p04-23.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p04-23.jpg', image_type='image/jpeg', image_size=62418, image_key='static:/wholesale-products/p04-23.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P04-23' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-01','GUTTER ANGLE SQUARE INT 0.4X300X75MM','GUTTER ANGLE SQUARE INT 0.4X300X75MM','Roofing','p05-01.jpg','image/jpeg',85332,'static:/wholesale-products/p05-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-01.jpg', image_type='image/jpeg', image_size=85332, image_key='static:/wholesale-products/p05-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-01' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-02','WATERPROOFING MEMBRANE','WATERPROOFING MEMBRANE','Roofing','p05-02.jpg','image/jpeg',58904,'static:/wholesale-products/p05-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-02.jpg', image_type='image/jpeg', image_size=58904, image_key='static:/wholesale-products/p05-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-02' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-03','DOWN PIPE GUTTER GALV ROUND CRIMP SHOW 0.40X75MMX2.7M','DOWN PIPE GUTTER GALV ROUND CRIMP SHOW 0.40X75MMX2.7M','Roofing','p05-03.jpg','image/jpeg',34069,'static:/wholesale-products/p05-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-03.jpg', image_type='image/jpeg', image_size=34069, image_key='static:/wholesale-products/p05-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-03' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-04','DOWN PIPE GUTTER GALV MAXI RIPPLE CRIMP BUDGET 100X75MMX2.7M','DOWN PIPE GUTTER GALV MAXI RIPPLE CRIMP BUDGET 100X75MMX2.7M','Roofing','p05-04.jpg','image/jpeg',49856,'static:/wholesale-products/p05-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-04.jpg', image_type='image/jpeg', image_size=49856, image_key='static:/wholesale-products/p05-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-04' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-05','GUTTER DOMESTIC BUDGET 100X75MMX6.0M','GUTTER DOMESTIC BUDGET 100X75MMX6.0M','Roofing','p05-05.jpg','image/jpeg',48320,'static:/wholesale-products/p05-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-05.jpg', image_type='image/jpeg', image_size=48320, image_key='static:/wholesale-products/p05-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-05' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-06','OUTLET GUTTER LIPPED SQUARE REP BUDGET 100X75MM','OUTLET GUTTER LIPPED SQUARE REP BUDGET 100X75MM','Roofing','p05-06.jpg','image/jpeg',43287,'static:/wholesale-products/p05-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-06.jpg', image_type='image/jpeg', image_size=43287, image_key='static:/wholesale-products/p05-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-06' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-07','BOARD FASCIA FIBER CEMENT 225X3.6 9MM','BOARD FASCIA FIBER CEMENT 225X3.6 9MM','Roofing','p05-07.jpg','image/jpeg',52581,'static:/wholesale-products/p05-07.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-07.jpg', image_type='image/jpeg', image_size=52581, image_key='static:/wholesale-products/p05-07.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-07' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-08','OFFSET ROUND GUTTER GALV CRIMP 0.40X75X600MM','OFFSET ROUND GUTTER GALV CRIMP 0.40X75X600MM','Roofing','p05-08.jpg','image/jpeg',72793,'static:/wholesale-products/p05-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-08.jpg', image_type='image/jpeg', image_size=72793, image_key='static:/wholesale-products/p05-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-08' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-09','ROOFTILE MARLEY DOUBLE ROMAN UNIVERSAL','ROOFTILE MARLEY DOUBLE ROMAN UNIVERSAL','Roofing','p05-09.jpg','image/jpeg',52106,'static:/wholesale-products/p05-09.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-09.jpg', image_type='image/jpeg', image_size=52106, image_key='static:/wholesale-products/p05-09.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-09' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-10','CORRUGATED ROOF SHEETING','CORRUGATED ROOF SHEETING','Roofing','p05-10.jpg','image/jpeg',164500,'static:/wholesale-products/p05-10.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-10.jpg', image_type='image/jpeg', image_size=164500, image_key='static:/wholesale-products/p05-10.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-11','UNDERLAY ROOFTILE','UNDERLAY ROOFTILE','Roofing','p05-11.jpg','image/jpeg',32862,'static:/wholesale-products/p05-11.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-11.jpg', image_type='image/jpeg', image_size=32862, image_key='static:/wholesale-products/p05-11.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-11' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-12','ROOF SHEETING CHROMADEK GREEN 0.4MM H/D 6M','ROOF SHEETING CHROMADEK GREEN 0.4MM H/D 6M','Roofing','p05-12.jpg','image/jpeg',107290,'static:/wholesale-products/p05-12.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-12.jpg', image_type='image/jpeg', image_size=107290, image_key='static:/wholesale-products/p05-12.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-12' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-13','ROOF SHEETING IBR','ROOF SHEETING IBR','Roofing','p05-13.jpg','image/jpeg',123419,'static:/wholesale-products/p05-13.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-13.jpg', image_type='image/jpeg', image_size=123419, image_key='static:/wholesale-products/p05-13.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-13' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-14','BOARD CEILING GYPSUM','BOARD CEILING GYPSUM','Roofing','p05-14.jpg','image/jpeg',126630,'static:/wholesale-products/p05-14.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-14.jpg', image_type='image/jpeg', image_size=126630, image_key='static:/wholesale-products/p05-14.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-14' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-15','TIMBER BXX/SABS BRANDERING','TIMBER BXX/SABS BRANDERING','Roofing','p05-15.jpg','image/jpeg',56091,'static:/wholesale-products/p05-15.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-15.jpg', image_type='image/jpeg', image_size=56091, image_key='static:/wholesale-products/p05-15.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-16','TIMBER BXX/SABS PURLIN','TIMBER BXX/SABS PURLIN','Roofing','p05-16.jpg','image/jpeg',55960,'static:/wholesale-products/p05-16.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-16.jpg', image_type='image/jpeg', image_size=55960, image_key='static:/wholesale-products/p05-16.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-16' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P05-17','TIMBER BXX/SABS RAFTERS','TIMBER BXX/SABS RAFTERS','Roofing','p05-17.jpg','image/jpeg',56123,'static:/wholesale-products/p05-17.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p05-17.jpg', image_type='image/jpeg', image_size=56123, image_key='static:/wholesale-products/p05-17.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P05-17' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-01','FANCY CYLINDER LOCKSET','FANCY CYLINDER LOCKSET. Visual variant 1 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-01.jpg','image/jpeg',75096,'static:/wholesale-products/p06-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-01.jpg', image_type='image/jpeg', image_size=75096, image_key='static:/wholesale-products/p06-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-01' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-02','FANCY CYLINDER LOCKSET','FANCY CYLINDER LOCKSET. Visual variant 2 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-02.jpg','image/jpeg',88363,'static:/wholesale-products/p06-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-02.jpg', image_type='image/jpeg', image_size=88363, image_key='static:/wholesale-products/p06-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-02' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-03','CYLINDER LOCKSET','CYLINDER LOCKSET. Visual variant 3 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-03.jpg','image/jpeg',75614,'static:/wholesale-products/p06-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-03.jpg', image_type='image/jpeg', image_size=75614, image_key='static:/wholesale-products/p06-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-03' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-04','FANCY CYLINDER LOCKSET','FANCY CYLINDER LOCKSET. Visual variant 4 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-04.jpg','image/jpeg',85736,'static:/wholesale-products/p06-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-04.jpg', image_type='image/jpeg', image_size=85736, image_key='static:/wholesale-products/p06-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-04' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-05','GEORGIAN LOCKSET','GEORGIAN LOCKSET. Visual variant 5 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-05.jpg','image/jpeg',93896,'static:/wholesale-products/p06-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-05.jpg', image_type='image/jpeg', image_size=93896, image_key='static:/wholesale-products/p06-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-05' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-06','FANCY CYLINDER LOCKSET 3 LEVER MORTICE','FANCY CYLINDER LOCKSET 3 LEVER MORTICE. Visual variant 6 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-06.jpg','image/jpeg',72599,'static:/wholesale-products/p06-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-06.jpg', image_type='image/jpeg', image_size=72599, image_key='static:/wholesale-products/p06-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-06' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-07','FANCY CYLINDER LOCKSET 3 LEVER MORTICE','FANCY CYLINDER LOCKSET 3 LEVER MORTICE. Visual variant 7 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-07.jpg','image/jpeg',89049,'static:/wholesale-products/p06-07.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-07.jpg', image_type='image/jpeg', image_size=89049, image_key='static:/wholesale-products/p06-07.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-07' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-08','H/DUTY MORTICE LOCKSET','H/DUTY MORTICE LOCKSET. Visual variant 8 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-08.jpg','image/jpeg',70052,'static:/wholesale-products/p06-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-08.jpg', image_type='image/jpeg', image_size=70052, image_key='static:/wholesale-products/p06-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-08' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-09','FANCY CYLINDER LOCKSET','FANCY CYLINDER LOCKSET. Visual variant 9 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-09.jpg','image/jpeg',70747,'static:/wholesale-products/p06-09.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-09.jpg', image_type='image/jpeg', image_size=70747, image_key='static:/wholesale-products/p06-09.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-09' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-10','FANCY CYLINDER LOCKSET 3 LEVER MORTICE','FANCY CYLINDER LOCKSET 3 LEVER MORTICE. Visual variant 10 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-10.jpg','image/jpeg',96852,'static:/wholesale-products/p06-10.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-10.jpg', image_type='image/jpeg', image_size=96852, image_key='static:/wholesale-products/p06-10.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-11','FANCY CYLINDER LOCKSET 3 LEVER MORTICE','FANCY CYLINDER LOCKSET 3 LEVER MORTICE. Visual variant 11 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-11.jpg','image/jpeg',109367,'static:/wholesale-products/p06-11.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-11.jpg', image_type='image/jpeg', image_size=109367, image_key='static:/wholesale-products/p06-11.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-11' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-12','FANCY CYLINDER LOCKSET 3 LEVER MORTICE','FANCY CYLINDER LOCKSET 3 LEVER MORTICE. Visual variant 12 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-12.jpg','image/jpeg',71748,'static:/wholesale-products/p06-12.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-12.jpg', image_type='image/jpeg', image_size=71748, image_key='static:/wholesale-products/p06-12.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-12' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-13','FANCY CYLINDER LOCKSET 3 LEVER MORTICE','FANCY CYLINDER LOCKSET 3 LEVER MORTICE. Visual variant 13 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-13.jpg','image/jpeg',80113,'static:/wholesale-products/p06-13.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-13.jpg', image_type='image/jpeg', image_size=80113, image_key='static:/wholesale-products/p06-13.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-13' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-14','FANCY CYLINDER LOCKSET 3 LEVER MORTICE','FANCY CYLINDER LOCKSET 3 LEVER MORTICE. Visual variant 14 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-14.jpg','image/jpeg',71526,'static:/wholesale-products/p06-14.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-14.jpg', image_type='image/jpeg', image_size=71526, image_key='static:/wholesale-products/p06-14.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-14' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-15','CYLINDER LOCKSET','CYLINDER LOCKSET. Visual variant 15 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-15.jpg','image/jpeg',55518,'static:/wholesale-products/p06-15.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-15.jpg', image_type='image/jpeg', image_size=55518, image_key='static:/wholesale-products/p06-15.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-16','CYLINDER LOCKSET','CYLINDER LOCKSET. Visual variant 16 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-16.jpg','image/jpeg',78227,'static:/wholesale-products/p06-16.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-16.jpg', image_type='image/jpeg', image_size=78227, image_key='static:/wholesale-products/p06-16.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-16' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-17','CYLINDER LOCKSET 3 LEVER MORTICE','CYLINDER LOCKSET 3 LEVER MORTICE. Visual variant 17 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-17.jpg','image/jpeg',63549,'static:/wholesale-products/p06-17.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-17.jpg', image_type='image/jpeg', image_size=63549, image_key='static:/wholesale-products/p06-17.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-17' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-18','CYLINDER LOCKSET 3 LEVER MORTICE','CYLINDER LOCKSET 3 LEVER MORTICE. Visual variant 18 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-18.jpg','image/jpeg',63366,'static:/wholesale-products/p06-18.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-18.jpg', image_type='image/jpeg', image_size=63366, image_key='static:/wholesale-products/p06-18.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-18' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-19','CYLINDER LOCKSET 3 LEVER MORTICE','CYLINDER LOCKSET 3 LEVER MORTICE. Visual variant 19 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-19.jpg','image/jpeg',77583,'static:/wholesale-products/p06-19.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-19.jpg', image_type='image/jpeg', image_size=77583, image_key='static:/wholesale-products/p06-19.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-19' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-20','CYLINDER LOCKSET 3 LEVER MORTICE','CYLINDER LOCKSET 3 LEVER MORTICE. Visual variant 20 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-20.jpg','image/jpeg',69687,'static:/wholesale-products/p06-20.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-20.jpg', image_type='image/jpeg', image_size=69687, image_key='static:/wholesale-products/p06-20.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-20' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-21','FANCY CYLINDER LOCKSET 3 LEVER MORTICE','FANCY CYLINDER LOCKSET 3 LEVER MORTICE. Visual variant 21 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-21.jpg','image/jpeg',101800,'static:/wholesale-products/p06-21.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-21.jpg', image_type='image/jpeg', image_size=101800, image_key='static:/wholesale-products/p06-21.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-21' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-22','ROCCA 2 LEVER MORTICE LOCKSET','ROCCA 2 LEVER MORTICE LOCKSET. Visual variant 22 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-22.jpg','image/jpeg',62575,'static:/wholesale-products/p06-22.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-22.jpg', image_type='image/jpeg', image_size=62575, image_key='static:/wholesale-products/p06-22.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-22' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-23','ROCCA MORTICE LOCKSET RL20','ROCCA MORTICE LOCKSET RL20. Visual variant 23 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-23.jpg','image/jpeg',63720,'static:/wholesale-products/p06-23.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-23.jpg', image_type='image/jpeg', image_size=63720, image_key='static:/wholesale-products/p06-23.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-23' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P06-24','ROCCA MORTICE LOCKSET RL50','ROCCA MORTICE LOCKSET RL50. Visual variant 24 as shown in the original wholesale catalogue.','Fasteners & Ironmongery','p06-24.jpg','image/jpeg',73560,'static:/wholesale-products/p06-24.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p06-24.jpg', image_type='image/jpeg', image_size=73560, image_key='static:/wholesale-products/p06-24.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P06-24' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-01','DOOR MASONITE WHITE 2,4,6 PANEL','DOOR MASONITE WHITE 2,4,6 PANEL','Doors & Frames','p07-01.jpg','image/jpeg',39155,'static:/wholesale-products/p07-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-01.jpg', image_type='image/jpeg', image_size=39155, image_key='static:/wholesale-products/p07-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-01' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-02','DOOR MASONITE CLASSIC GREY 2,4,6 PANEL','DOOR MASONITE CLASSIC GREY 2,4,6 PANEL','Doors & Frames','p07-02.jpg','image/jpeg',75034,'static:/wholesale-products/p07-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-02.jpg', image_type='image/jpeg', image_size=75034, image_key='static:/wholesale-products/p07-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-02' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-03','DOOR MASONITE','DOOR MASONITE','Doors & Frames','p07-03.jpg','image/jpeg',28672,'static:/wholesale-products/p07-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-03.jpg', image_type='image/jpeg', image_size=28672, image_key='static:/wholesale-products/p07-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-03' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-04','DOOR MASONITE HARDWOOD HORIZONTAL','DOOR MASONITE HARDWOOD HORIZONTAL','Doors & Frames','p07-04.jpg','image/jpeg',33103,'static:/wholesale-products/p07-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-04.jpg', image_type='image/jpeg', image_size=33103, image_key='static:/wholesale-products/p07-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-04' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-05','DOOR MASONITE SAPELE','DOOR MASONITE SAPELE','Doors & Frames','p07-05.jpg','image/jpeg',32544,'static:/wholesale-products/p07-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-05.jpg', image_type='image/jpeg', image_size=32544, image_key='static:/wholesale-products/p07-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-05' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-06','DOOR MASONITE WHITE HORIZONTAL','DOOR MASONITE WHITE HORIZONTAL','Doors & Frames','p07-06.jpg','image/jpeg',9478,'static:/wholesale-products/p07-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-06.jpg', image_type='image/jpeg', image_size=9478, image_key='static:/wholesale-products/p07-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-06' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-07','DOOR ALU 3 PANEL FULL RIGHT/LEFT','DOOR ALU 3 PANEL FULL RIGHT/LEFT','Doors & Frames','p07-07.jpg','image/jpeg',74842,'static:/wholesale-products/p07-07.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-07.jpg', image_type='image/jpeg', image_size=74842, image_key='static:/wholesale-products/p07-07.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-07' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-08','DOOR PINE 8 PANE FULL','DOOR PINE 8 PANE FULL','Doors & Frames','p07-08.jpg','image/jpeg',44997,'static:/wholesale-products/p07-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-08.jpg', image_type='image/jpeg', image_size=44997, image_key='static:/wholesale-products/p07-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-08' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-09','DOOR PINE 8 PANE STABLE','DOOR PINE 8 PANE STABLE','Doors & Frames','p07-09.jpg','image/jpeg',43344,'static:/wholesale-products/p07-09.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-09.jpg', image_type='image/jpeg', image_size=43344, image_key='static:/wholesale-products/p07-09.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-09' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-10','DOOR PINE BACK TO BACK','DOOR PINE BACK TO BACK','Doors & Frames','p07-10.jpg','image/jpeg',41579,'static:/wholesale-products/p07-10.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-10.jpg', image_type='image/jpeg', image_size=41579, image_key='static:/wholesale-products/p07-10.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-11','DOOR PINE OB Z BRACED','DOOR PINE OB Z BRACED','Doors & Frames','p07-11.jpg','image/jpeg',44603,'static:/wholesale-products/p07-11.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-11.jpg', image_type='image/jpeg', image_size=44603, image_key='static:/wholesale-products/p07-11.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-11' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-12','DOOR ALU 4 PANEL FULL','DOOR ALU 4 PANEL FULL','Doors & Frames','p07-12.jpg','image/jpeg',23327,'static:/wholesale-products/p07-12.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-12.jpg', image_type='image/jpeg', image_size=23327, image_key='static:/wholesale-products/p07-12.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-12' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-13','DOOR ALU FANCY ARROW','DOOR ALU FANCY ARROW','Doors & Frames','p07-13.jpg','image/jpeg',36527,'static:/wholesale-products/p07-13.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-13.jpg', image_type='image/jpeg', image_size=36527, image_key='static:/wholesale-products/p07-13.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-13' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-14','DOOR ALU SLIDING','DOOR ALU SLIDING','Doors & Frames','p07-14.jpg','image/jpeg',21140,'static:/wholesale-products/p07-14.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-14.jpg', image_type='image/jpeg', image_size=21140, image_key='static:/wholesale-products/p07-14.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-14' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-15','COMBINATION DOOR HD O/I LEFT','COMBINATION DOOR HD O/I LEFT','Doors & Frames','p07-15.jpg','image/jpeg',27168,'static:/wholesale-products/p07-15.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-15.jpg', image_type='image/jpeg', image_size=27168, image_key='static:/wholesale-products/p07-15.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-16','COMBINATION DOOR HD O/I RIGHT','COMBINATION DOOR HD O/I RIGHT','Doors & Frames','p07-16.jpg','image/jpeg',27422,'static:/wholesale-products/p07-16.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-16.jpg', image_type='image/jpeg', image_size=27422, image_key='static:/wholesale-products/p07-16.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-16' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-17','COMBINATION DOOR HD O/O RIGHT','COMBINATION DOOR HD O/O RIGHT','Doors & Frames','p07-17.jpg','image/jpeg',20667,'static:/wholesale-products/p07-17.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-17.jpg', image_type='image/jpeg', image_size=20667, image_key='static:/wholesale-products/p07-17.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-17' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-18','COMBINATION DOOR HD O/O LEFT','COMBINATION DOOR HD O/O LEFT','Doors & Frames','p07-18.jpg','image/jpeg',20668,'static:/wholesale-products/p07-18.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-18.jpg', image_type='image/jpeg', image_size=20668, image_key='static:/wholesale-products/p07-18.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-18' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-19','DOORFRAME STEEL STABLE RIGHT H/D','DOORFRAME STEEL STABLE RIGHT H/D','Doors & Frames','p07-19.jpg','image/jpeg',16392,'static:/wholesale-products/p07-19.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-19.jpg', image_type='image/jpeg', image_size=16392, image_key='static:/wholesale-products/p07-19.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-19' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-20','DOORFRAME STEEL STABLE LEFT H/D','DOORFRAME STEEL STABLE LEFT H/D','Doors & Frames','p07-20.jpg','image/jpeg',16399,'static:/wholesale-products/p07-20.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-20.jpg', image_type='image/jpeg', image_size=16399, image_key='static:/wholesale-products/p07-20.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-20' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P07-21','WHITE SOLID DOOR 8 PANEL','WHITE SOLID DOOR 8 PANEL','Doors & Frames','p07-21.jpg','image/jpeg',14599,'static:/wholesale-products/p07-21.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p07-21.jpg', image_type='image/jpeg', image_size=14599, image_key='static:/wholesale-products/p07-21.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P07-21' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-01','POST CORNER 2.4 X 65MM ECONO GALV','POST CORNER 2.4 X 65MM ECONO GALV','Fencing','p08-01.jpg','image/jpeg',92163,'static:/wholesale-products/p08-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-01.jpg', image_type='image/jpeg', image_size=92163, image_key='static:/wholesale-products/p08-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-01' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-02','WIRE MESH CHICKEN ELECTRO','WIRE MESH CHICKEN ELECTRO','Fencing','p08-02.jpg','image/jpeg',116922,'static:/wholesale-products/p08-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-02.jpg', image_type='image/jpeg', image_size=116922, image_key='static:/wholesale-products/p08-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-02' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-03','K STANDARD 2.4M V01 FOR 100+','K STANDARD 2.4M V01 FOR 100+','Fencing','p08-03.jpg','image/jpeg',107221,'static:/wholesale-products/p08-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-03.jpg', image_type='image/jpeg', image_size=107221, image_key='static:/wholesale-products/p08-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-03' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-WM01','WIRE MESH 1.8X30M - HOT DIP 100X100','WIRE MESH 1.8X30M - HOT DIP 100X100','Fencing','p08-04.jpg','image/jpeg',100798,'static:/wholesale-products/p08-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-04.jpg', image_type='image/jpeg', image_size=100798, image_key='static:/wholesale-products/p08-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-WM01' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-WM02','WIRE MESH 1.8X30M - HOT DIP 50X50','WIRE MESH 1.8X30M - HOT DIP 50X50','Fencing','p08-04.jpg','image/jpeg',100798,'static:/wholesale-products/p08-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-04.jpg', image_type='image/jpeg', image_size=100798, image_key='static:/wholesale-products/p08-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-WM02' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-WM03','WIRE MESH 1.8X30M - ELECTRO 50X100','WIRE MESH 1.8X30M - ELECTRO 50X100','Fencing','p08-04.jpg','image/jpeg',100798,'static:/wholesale-products/p08-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-04.jpg', image_type='image/jpeg', image_size=100798, image_key='static:/wholesale-products/p08-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-WM03' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-WM04','WIRE MESH 1.8X30M - ELECTRO 100X100','WIRE MESH 1.8X30M - ELECTRO 100X100','Fencing','p08-04.jpg','image/jpeg',100798,'static:/wholesale-products/p08-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-04.jpg', image_type='image/jpeg', image_size=100798, image_key='static:/wholesale-products/p08-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-WM04' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-WM05','WIRE MESH 1.8X30M - ELECTRO 50X50','WIRE MESH 1.8X30M - ELECTRO 50X50','Fencing','p08-04.jpg','image/jpeg',100798,'static:/wholesale-products/p08-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-04.jpg', image_type='image/jpeg', image_size=100798, image_key='static:/wholesale-products/p08-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-WM05' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-WM06','WIRE MESH 1.8X30M - SUPER COMBO 50X100','WIRE MESH 1.8X30M - SUPER COMBO 50X100','Fencing','p08-04.jpg','image/jpeg',100798,'static:/wholesale-products/p08-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-04.jpg', image_type='image/jpeg', image_size=100798, image_key='static:/wholesale-products/p08-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-WM06' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-WM07','WIRE MESH 1.8X30M - SUPER COMBO 100X100','WIRE MESH 1.8X30M - SUPER COMBO 100X100','Fencing','p08-04.jpg','image/jpeg',100798,'static:/wholesale-products/p08-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-04.jpg', image_type='image/jpeg', image_size=100798, image_key='static:/wholesale-products/p08-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-WM07' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-WM08','WIRE MESH 1.8X30M - SUPER COMBO 50X50','WIRE MESH 1.8X30M - SUPER COMBO 50X50','Fencing','p08-04.jpg','image/jpeg',100798,'static:/wholesale-products/p08-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-04.jpg', image_type='image/jpeg', image_size=100798, image_key='static:/wholesale-products/p08-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-WM08' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-05','WIRE BARBED GALV DOUBLE STRAND 50KG H/D','WIRE BARBED GALV DOUBLE STRAND 50KG H/D','Fencing','p08-05.jpg','image/jpeg',376369,'static:/wholesale-products/p08-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-05.jpg', image_type='image/jpeg', image_size=376369, image_key='static:/wholesale-products/p08-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-05' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-BW01','WIRE BARBED GALV DOUBLE STRAND - +/- 40 HEAVY DUTY','WIRE BARBED GALV DOUBLE STRAND - +/- 40 HEAVY DUTY','Fencing','p08-06.jpg','image/jpeg',274243,'static:/wholesale-products/p08-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-06.jpg', image_type='image/jpeg', image_size=274243, image_key='static:/wholesale-products/p08-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-BW01' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-BW02','WIRE BARBED GALV DOUBLE STRAND - +/- 17KG HEAVY DUTY','WIRE BARBED GALV DOUBLE STRAND - +/- 17KG HEAVY DUTY','Fencing','p08-06.jpg','image/jpeg',274243,'static:/wholesale-products/p08-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-06.jpg', image_type='image/jpeg', image_size=274243, image_key='static:/wholesale-products/p08-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-BW02' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-BW03','WIRE BARBED GALV DOUBLE STRAND - +/- 35KG HEAVY DUTY','WIRE BARBED GALV DOUBLE STRAND - +/- 35KG HEAVY DUTY','Fencing','p08-06.jpg','image/jpeg',274243,'static:/wholesale-products/p08-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-06.jpg', image_type='image/jpeg', image_size=274243, image_key='static:/wholesale-products/p08-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-BW03' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-BW04','WIRE BARBED GALV DOUBLE STRAND - +/- 25KG HEAVY DUTY','WIRE BARBED GALV DOUBLE STRAND - +/- 25KG HEAVY DUTY','Fencing','p08-06.jpg','image/jpeg',274243,'static:/wholesale-products/p08-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-06.jpg', image_type='image/jpeg', image_size=274243, image_key='static:/wholesale-products/p08-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-BW04' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P08-07','FENCE STAY GALV L/D','FENCE STAY GALV L/D','Fencing','p08-07.jpg','image/jpeg',41840,'static:/wholesale-products/p08-07.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p08-07.jpg', image_type='image/jpeg', image_size=41840, image_key='static:/wholesale-products/p08-07.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P08-07' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR3206-100','BLIND RIVET 3.2X06 100 PCS','3.2X06 - 100 PCS','Fasteners & Ironmongery','p09-01.jpg','image/jpeg',60171,'static:/wholesale-products/p09-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-01.jpg', image_type='image/jpeg', image_size=60171, image_key='static:/wholesale-products/p09-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR3206-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR3208-100','BLIND RIVET 3.2X08 100 PCS','3.2X08 - 100 PCS','Fasteners & Ironmongery','p09-01.jpg','image/jpeg',60171,'static:/wholesale-products/p09-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-01.jpg', image_type='image/jpeg', image_size=60171, image_key='static:/wholesale-products/p09-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR3208-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR3210-100','BLIND RIVET 3.2X10 100 PCS','3.2X10 - 100 PCS','Fasteners & Ironmongery','p09-01.jpg','image/jpeg',60171,'static:/wholesale-products/p09-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-01.jpg', image_type='image/jpeg', image_size=60171, image_key='static:/wholesale-products/p09-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR3210-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR3212-100','BLIND RIVET 3.2X12 100 PCS','3.2X12 - 100 PCS','Fasteners & Ironmongery','p09-01.jpg','image/jpeg',60171,'static:/wholesale-products/p09-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-01.jpg', image_type='image/jpeg', image_size=60171, image_key='static:/wholesale-products/p09-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR3212-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR3218-100','BLIND RIVET 3.2X18 100 PCS','3.2X18 - 100 PCS','Fasteners & Ironmongery','p09-01.jpg','image/jpeg',60171,'static:/wholesale-products/p09-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-01.jpg', image_type='image/jpeg', image_size=60171, image_key='static:/wholesale-products/p09-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR3218-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR3221-100','BLIND RIVET 3.2X21 100 PCS','3.2X21 - 100 PCS','Fasteners & Ironmongery','p09-01.jpg','image/jpeg',60171,'static:/wholesale-products/p09-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-01.jpg', image_type='image/jpeg', image_size=60171, image_key='static:/wholesale-products/p09-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR3221-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4006-100','BLIND RIVET 4.0X06 100 PCS','4.0X06 - 100 PCS','Fasteners & Ironmongery','p09-02.jpg','image/jpeg',60182,'static:/wholesale-products/p09-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-02.jpg', image_type='image/jpeg', image_size=60182, image_key='static:/wholesale-products/p09-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4006-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4008-100','BLIND RIVET 4.0X08 100 PCS','4.0X08 - 100 PCS','Fasteners & Ironmongery','p09-02.jpg','image/jpeg',60182,'static:/wholesale-products/p09-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-02.jpg', image_type='image/jpeg', image_size=60182, image_key='static:/wholesale-products/p09-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4008-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4010-100','BLIND RIVET 4.0X10 100 PCS','4.0X10 - 100 PCS','Fasteners & Ironmongery','p09-02.jpg','image/jpeg',60182,'static:/wholesale-products/p09-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-02.jpg', image_type='image/jpeg', image_size=60182, image_key='static:/wholesale-products/p09-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4010-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4012-100','BLIND RIVET 4.0X12 100 PCS','4.0X12 - 100 PCS','Fasteners & Ironmongery','p09-02.jpg','image/jpeg',60182,'static:/wholesale-products/p09-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-02.jpg', image_type='image/jpeg', image_size=60182, image_key='static:/wholesale-products/p09-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4012-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4015-100','BLIND RIVET 4.0X15 100 PCS','4.0X15 - 100 PCS','Fasteners & Ironmongery','p09-02.jpg','image/jpeg',60182,'static:/wholesale-products/p09-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-02.jpg', image_type='image/jpeg', image_size=60182, image_key='static:/wholesale-products/p09-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4015-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4018-100','BLIND RIVET 4.0X18 100 PCS','4.0X18 - 100 PCS','Fasteners & Ironmongery','p09-02.jpg','image/jpeg',60182,'static:/wholesale-products/p09-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-02.jpg', image_type='image/jpeg', image_size=60182, image_key='static:/wholesale-products/p09-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4018-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BRLF4010-100','BLIND RIVET 4.0X10 100 PCS','4.0X10 - 100 PCS','Fasteners & Ironmongery','p09-04.jpg','image/jpeg',60181,'static:/wholesale-products/p09-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-04.jpg', image_type='image/jpeg', image_size=60181, image_key='static:/wholesale-products/p09-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BRLF4010-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BRLF4012-100','BLIND RIVET 4.0X12 100 PCS','4.0X12 - 100 PCS','Fasteners & Ironmongery','p09-04.jpg','image/jpeg',60181,'static:/wholesale-products/p09-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-04.jpg', image_type='image/jpeg', image_size=60181, image_key='static:/wholesale-products/p09-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BRLF4012-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4812-100','BLIND RIVET 4.8X12 100 PCS','4.8X12 - 100 PCS','Fasteners & Ironmongery','p09-04.jpg','image/jpeg',60181,'static:/wholesale-products/p09-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-04.jpg', image_type='image/jpeg', image_size=60181, image_key='static:/wholesale-products/p09-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4812-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4815-100','BLIND RIVET 4.8X15 100 PCS','4.8X15 - 100 PCS','Fasteners & Ironmongery','p09-04.jpg','image/jpeg',60181,'static:/wholesale-products/p09-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-04.jpg', image_type='image/jpeg', image_size=60181, image_key='static:/wholesale-products/p09-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4815-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4818-100','BLIND RIVET 4.8X18 100 PCS','4.8X18 - 100 PCS','Fasteners & Ironmongery','p09-04.jpg','image/jpeg',60181,'static:/wholesale-products/p09-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-04.jpg', image_type='image/jpeg', image_size=60181, image_key='static:/wholesale-products/p09-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4818-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4821-100','BLIND RIVET 4.8X21 100 PCS','4.8X21 - 100 PCS','Fasteners & Ironmongery','p09-04.jpg','image/jpeg',60181,'static:/wholesale-products/p09-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-04.jpg', image_type='image/jpeg', image_size=60181, image_key='static:/wholesale-products/p09-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4821-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BRLF4015-100','BLIND RIVET 4.0X15 100 PCS','4.0X15 - 100 PCS','Fasteners & Ironmongery','p09-05.jpg','image/jpeg',60128,'static:/wholesale-products/p09-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-05.jpg', image_type='image/jpeg', image_size=60128, image_key='static:/wholesale-products/p09-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BRLF4015-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BRLF4021-100','BLIND RIVET 4.0X21 100 PCS','4.0X21 - 100 PCS','Fasteners & Ironmongery','p09-05.jpg','image/jpeg',60128,'static:/wholesale-products/p09-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-05.jpg', image_type='image/jpeg', image_size=60128, image_key='static:/wholesale-products/p09-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BRLF4021-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4810-100','BLIND RIVET 4.8X10 100 PCS','4.8X10 - 100 PCS','Fasteners & Ironmongery','p09-05.jpg','image/jpeg',60128,'static:/wholesale-products/p09-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-05.jpg', image_type='image/jpeg', image_size=60128, image_key='static:/wholesale-products/p09-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4810-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4824-100','BLIND RIVET 4.8X24 100 PCS','4.8X24 - 100 PCS','Fasteners & Ironmongery','p09-06.jpg','image/jpeg',60112,'static:/wholesale-products/p09-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-06.jpg', image_type='image/jpeg', image_size=60112, image_key='static:/wholesale-products/p09-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4824-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4810-25','BLIND RIVET 4.8X10 25 PCS','4.8X10 - 25 PCS','Fasteners & Ironmongery','p09-08.jpg','image/jpeg',60336,'static:/wholesale-products/p09-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-08.jpg', image_type='image/jpeg', image_size=60336, image_key='static:/wholesale-products/p09-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4810-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4812-25','BLIND RIVET 4.8X12 25 PCS','4.8X12 - 25 PCS','Fasteners & Ironmongery','p09-08.jpg','image/jpeg',60336,'static:/wholesale-products/p09-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-08.jpg', image_type='image/jpeg', image_size=60336, image_key='static:/wholesale-products/p09-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4812-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4815-25','BLIND RIVET 4.8X15 25 PCS','4.8X15 - 25 PCS','Fasteners & Ironmongery','p09-08.jpg','image/jpeg',60336,'static:/wholesale-products/p09-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-08.jpg', image_type='image/jpeg', image_size=60336, image_key='static:/wholesale-products/p09-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4815-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BR4821-25','BLIND RIVET 4.8X21 25 PCS','4.8X21 - 25 PCS','Fasteners & Ironmongery','p09-08.jpg','image/jpeg',60336,'static:/wholesale-products/p09-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-08.jpg', image_type='image/jpeg', image_size=60336, image_key='static:/wholesale-products/p09-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BR4821-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-WP10-10','WALL PLUG 10MM 10 PCS','10MM - 10 PCS','Fasteners & Ironmongery','p09-09.jpg','image/jpeg',64383,'static:/wholesale-products/p09-09.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-09.jpg', image_type='image/jpeg', image_size=64383, image_key='static:/wholesale-products/p09-09.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-WP10-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-WP12-5','WALL PLUG 12MM 5 PCS','12MM - 5 PCS','Fasteners & Ironmongery','p09-09.jpg','image/jpeg',64383,'static:/wholesale-products/p09-09.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-09.jpg', image_type='image/jpeg', image_size=64383, image_key='static:/wholesale-products/p09-09.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-WP12-5' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BW6019-200','BONDED WASHER 6X19 200 PCS','6X19 - 200 PCS','Fasteners & Ironmongery','p09-10.jpg','image/jpeg',85050,'static:/wholesale-products/p09-10.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-10.jpg', image_type='image/jpeg', image_size=85050, image_key='static:/wholesale-products/p09-10.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BW6019-200' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BW6019-500','BONDED WASHER 6X19 500 PCS','6X19 - 500 PCS','Fasteners & Ironmongery','p09-10.jpg','image/jpeg',85050,'static:/wholesale-products/p09-10.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-10.jpg', image_type='image/jpeg', image_size=85050, image_key='static:/wholesale-products/p09-10.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BW6019-500' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BW6026-200','BONDED WASHER 6X26 200 PCS','6X26 - 200 PCS','Fasteners & Ironmongery','p09-10.jpg','image/jpeg',85050,'static:/wholesale-products/p09-10.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-10.jpg', image_type='image/jpeg', image_size=85050, image_key='static:/wholesale-products/p09-10.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BW6026-200' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BW6026-500','BONDED WASHER 6X26 500 PCS','6X26 - 500 PCS','Fasteners & Ironmongery','p09-10.jpg','image/jpeg',85050,'static:/wholesale-products/p09-10.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-10.jpg', image_type='image/jpeg', image_size=85050, image_key='static:/wholesale-products/p09-10.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BW6026-500' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BW6019-25','BONDED WASHER 6X19 25 PCS','6X19 - 25 PCS','Fasteners & Ironmongery','p09-11.jpg','image/jpeg',70086,'static:/wholesale-products/p09-11.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-11.jpg', image_type='image/jpeg', image_size=70086, image_key='static:/wholesale-products/p09-11.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BW6019-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BW6019-50','BONDED WASHER 6X19 50 PCS','6X19 - 50 PCS','Fasteners & Ironmongery','p09-11.jpg','image/jpeg',70086,'static:/wholesale-products/p09-11.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-11.jpg', image_type='image/jpeg', image_size=70086, image_key='static:/wholesale-products/p09-11.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BW6019-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BW6026-25','BONDED WASHER 6X26 25 PCS','6X26 - 25 PCS','Fasteners & Ironmongery','p09-11.jpg','image/jpeg',70086,'static:/wholesale-products/p09-11.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-11.jpg', image_type='image/jpeg', image_size=70086, image_key='static:/wholesale-products/p09-11.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BW6026-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BW6026-50','BONDED WASHER 6X26 50 PCS','6X26 - 50 PCS','Fasteners & Ironmongery','p09-11.jpg','image/jpeg',70086,'static:/wholesale-products/p09-11.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-11.jpg', image_type='image/jpeg', image_size=70086, image_key='static:/wholesale-products/p09-11.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BW6026-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-BWS026-25','BONDED WASHER 6X26 25 PCS','6X26 - 25 PCS','Fasteners & Ironmongery','p09-11.jpg','image/jpeg',70086,'static:/wholesale-products/p09-11.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-11.jpg', image_type='image/jpeg', image_size=70086, image_key='static:/wholesale-products/p09-11.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-BWS026-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-TSS5538-100','TOP SPEED SCREW 5.5X38 100 PCS','5.5X38 - 100 PCS','Fasteners & Ironmongery','p09-12.jpg','image/jpeg',139417,'static:/wholesale-products/p09-12.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-12.jpg', image_type='image/jpeg', image_size=139417, image_key='static:/wholesale-products/p09-12.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-TSS5538-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-TSS5550-100','TOP SPEED SCREW 5.5X50 100 PCS','5.5X50 - 100 PCS','Fasteners & Ironmongery','p09-12.jpg','image/jpeg',139417,'static:/wholesale-products/p09-12.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-12.jpg', image_type='image/jpeg', image_size=139417, image_key='static:/wholesale-products/p09-12.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-TSS5550-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-TSS5565-100','TOP SPEED SCREW 5.5X65 100 PCS','5.5X65 - 100 PCS','Fasteners & Ironmongery','p09-12.jpg','image/jpeg',139417,'static:/wholesale-products/p09-12.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-12.jpg', image_type='image/jpeg', image_size=139417, image_key='static:/wholesale-products/p09-12.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-TSS5565-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-TSS5590-100','TOP SPEED SCREW 5.5X90 100 PCS','5.5X90 - 100 PCS','Fasteners & Ironmongery','p09-12.jpg','image/jpeg',139417,'static:/wholesale-products/p09-12.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-12.jpg', image_type='image/jpeg', image_size=139417, image_key='static:/wholesale-products/p09-12.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-TSS5590-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-CSF8060-20','COACH SCREW COMBO 8X60 20 PCS','8X60 - 20 PCS','Fasteners & Ironmongery','p09-13.jpg','image/jpeg',84655,'static:/wholesale-products/p09-13.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-13.jpg', image_type='image/jpeg', image_size=84655, image_key='static:/wholesale-products/p09-13.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-CSF8060-20' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-CSF8060-60','COACH SCREW COMBO 8X60 60 PCS','8X60 - 60 PCS','Fasteners & Ironmongery','p09-13.jpg','image/jpeg',84655,'static:/wholesale-products/p09-13.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-13.jpg', image_type='image/jpeg', image_size=84655, image_key='static:/wholesale-products/p09-13.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-CSF8060-60' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-CSP6050-60','COACH SCREW COMBO 6X50 60 PCS','6X50 - 60 PCS','Fasteners & Ironmongery','p09-13.jpg','image/jpeg',84655,'static:/wholesale-products/p09-13.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-13.jpg', image_type='image/jpeg', image_size=84655, image_key='static:/wholesale-products/p09-13.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-CSP6050-60' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-CSP6030-8','COACH SCREW COMBO 6X30 8 PCS','6X30 - 8 PCS','Fasteners & Ironmongery','p09-14.jpg','image/jpeg',73605,'static:/wholesale-products/p09-14.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-14.jpg', image_type='image/jpeg', image_size=73605, image_key='static:/wholesale-products/p09-14.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-CSP6030-8' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-CSP6050-8','COACH SCREW COMBO 6X50 8 PCS','6X50 - 8 PCS','Fasteners & Ironmongery','p09-14.jpg','image/jpeg',73605,'static:/wholesale-products/p09-14.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-14.jpg', image_type='image/jpeg', image_size=73605, image_key='static:/wholesale-products/p09-14.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-CSP6050-8' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-CSP6060-8','COACH SCREW COMBO 6X60 8 PCS','6X60 - 8 PCS','Fasteners & Ironmongery','p09-14.jpg','image/jpeg',73605,'static:/wholesale-products/p09-14.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-14.jpg', image_type='image/jpeg', image_size=73605, image_key='static:/wholesale-products/p09-14.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-CSP6060-8' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-CSP8030-8','COACH SCREW COMBO 8X30 8 PCS','8X30 - 8 PCS','Fasteners & Ironmongery','p09-14.jpg','image/jpeg',73605,'static:/wholesale-products/p09-14.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-14.jpg', image_type='image/jpeg', image_size=73605, image_key='static:/wholesale-products/p09-14.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-CSP8030-8' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-CSP8050-8','COACH SCREW COMBO 8X50 8 PCS','8X50 - 8 PCS','Fasteners & Ironmongery','p09-14.jpg','image/jpeg',73605,'static:/wholesale-products/p09-14.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-14.jpg', image_type='image/jpeg', image_size=73605, image_key='static:/wholesale-products/p09-14.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-CSP8050-8' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-CSP1040-8','COACH SCREW COMBO 10X40 8 PCS','10X40 - 8 PCS','Fasteners & Ironmongery','p09-15.jpg','image/jpeg',73653,'static:/wholesale-products/p09-15.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-15.jpg', image_type='image/jpeg', image_size=73653, image_key='static:/wholesale-products/p09-15.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-CSP1040-8' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-CSP1050-8','COACH SCREW COMBO 10X50 8 PCS','10X50 - 8 PCS','Fasteners & Ironmongery','p09-15.jpg','image/jpeg',73653,'static:/wholesale-products/p09-15.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-15.jpg', image_type='image/jpeg', image_size=73653, image_key='static:/wholesale-products/p09-15.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-CSP1050-8' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-CSP1075-8','COACH SCREW COMBO 10X75 8 PCS','10X75 - 8 PCS','Fasteners & Ironmongery','p09-15.jpg','image/jpeg',73653,'static:/wholesale-products/p09-15.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-15.jpg', image_type='image/jpeg', image_size=73653, image_key='static:/wholesale-products/p09-15.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-CSP1075-8' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-CSP8075-8','COACH SCREW COMBO 8X75 8 PCS','8X75 - 8 PCS','Fasteners & Ironmongery','p09-15.jpg','image/jpeg',73653,'static:/wholesale-products/p09-15.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-15.jpg', image_type='image/jpeg', image_size=73653, image_key='static:/wholesale-products/p09-15.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-CSP8075-8' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3525-25','DRYWALL SCREW 3.5X25 25 PCS','3.5X25 - 25 PCS','Fasteners & Ironmongery','p09-16.jpg','image/jpeg',76003,'static:/wholesale-products/p09-16.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-16.jpg', image_type='image/jpeg', image_size=76003, image_key='static:/wholesale-products/p09-16.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3525-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3525-50','DRYWALL SCREW 3.5X25 50 PCS','3.5X25 - 50 PCS','Fasteners & Ironmongery','p09-16.jpg','image/jpeg',76003,'static:/wholesale-products/p09-16.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-16.jpg', image_type='image/jpeg', image_size=76003, image_key='static:/wholesale-products/p09-16.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3525-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3525-100','DRYWALL SCREW 3.5X35 100 PCS','3.5X35 - 100 PCS','Fasteners & Ironmongery','p09-16.jpg','image/jpeg',76003,'static:/wholesale-products/p09-16.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-16.jpg', image_type='image/jpeg', image_size=76003, image_key='static:/wholesale-products/p09-16.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3525-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3532-25','DRYWALL SCREW 3.5X32 25 PCS','3.5X32 - 25 PCS','Fasteners & Ironmongery','p09-16.jpg','image/jpeg',76003,'static:/wholesale-products/p09-16.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-16.jpg', image_type='image/jpeg', image_size=76003, image_key='static:/wholesale-products/p09-16.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3532-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3532-50','DRYWALL SCREW 3.5X32 50 PCS','3.5X32 - 50 PCS','Fasteners & Ironmongery','p09-16.jpg','image/jpeg',76003,'static:/wholesale-products/p09-16.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-16.jpg', image_type='image/jpeg', image_size=76003, image_key='static:/wholesale-products/p09-16.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3532-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3532-100','DRYWALL SCREW 3.5X32 100 PCS','3.5X32 - 100 PCS','Fasteners & Ironmongery','p09-16.jpg','image/jpeg',76003,'static:/wholesale-products/p09-16.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-16.jpg', image_type='image/jpeg', image_size=76003, image_key='static:/wholesale-products/p09-16.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3532-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3541-25','DRYWALL SCREW 3.5X41 25 PCS','3.5X41 - 25 PCS','Fasteners & Ironmongery','p09-17.jpg','image/jpeg',76037,'static:/wholesale-products/p09-17.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-17.jpg', image_type='image/jpeg', image_size=76037, image_key='static:/wholesale-products/p09-17.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3541-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3541-50','DRYWALL SCREW 3.5X41 50 PCS','3.5X41 - 50 PCS','Fasteners & Ironmongery','p09-17.jpg','image/jpeg',76037,'static:/wholesale-products/p09-17.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-17.jpg', image_type='image/jpeg', image_size=76037, image_key='static:/wholesale-products/p09-17.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3541-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3541-100','DRYWALL SCREW 3.5X41 100 PCS','3.5X41 - 100 PCS','Fasteners & Ironmongery','p09-17.jpg','image/jpeg',76037,'static:/wholesale-products/p09-17.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-17.jpg', image_type='image/jpeg', image_size=76037, image_key='static:/wholesale-products/p09-17.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3541-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC4075-25','DRYWALL SCREW 4.0X75 25 PCS','4.0X75 - 25 PCS','Fasteners & Ironmongery','p09-17.jpg','image/jpeg',76037,'static:/wholesale-products/p09-17.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-17.jpg', image_type='image/jpeg', image_size=76037, image_key='static:/wholesale-products/p09-17.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC4075-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC4075-50','DRYWALL SCREW 4.0X75 50 PCS','4.0X75 - 50 PCS','Fasteners & Ironmongery','p09-17.jpg','image/jpeg',76037,'static:/wholesale-products/p09-17.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-17.jpg', image_type='image/jpeg', image_size=76037, image_key='static:/wholesale-products/p09-17.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC4075-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3525-200','DRYWALL SCREW 3.5X25 200 PCS','3.5X25 - 200 PCS','Fasteners & Ironmongery','p09-18.jpg','image/jpeg',91513,'static:/wholesale-products/p09-18.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-18.jpg', image_type='image/jpeg', image_size=91513, image_key='static:/wholesale-products/p09-18.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3525-200' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3525-500','DRYWALL SCREW 3.5X25 500 PCS','3.5X25 - 500 PCS','Fasteners & Ironmongery','p09-18.jpg','image/jpeg',91513,'static:/wholesale-products/p09-18.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-18.jpg', image_type='image/jpeg', image_size=91513, image_key='static:/wholesale-products/p09-18.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3525-500' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3532-200','DRYWALL SCREW 3.5X32 200 PCS','3.5X32 - 200 PCS','Fasteners & Ironmongery','p09-18.jpg','image/jpeg',91513,'static:/wholesale-products/p09-18.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-18.jpg', image_type='image/jpeg', image_size=91513, image_key='static:/wholesale-products/p09-18.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3532-200' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3532-500','DRYWALL SCREW 3.5X32 500 PCS','3.5X32 - 500 PCS','Fasteners & Ironmongery','p09-18.jpg','image/jpeg',91513,'static:/wholesale-products/p09-18.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-18.jpg', image_type='image/jpeg', image_size=91513, image_key='static:/wholesale-products/p09-18.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3532-500' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC3541-200','DRYWALL SCREW 3.5X41 200 PCS','3.5X41 - 200 PCS','Fasteners & Ironmongery','p09-18.jpg','image/jpeg',91513,'static:/wholesale-products/p09-18.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-18.jpg', image_type='image/jpeg', image_size=91513, image_key='static:/wholesale-products/p09-18.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC3541-200' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC4075-200','DRYWALL SCREW 4X75 200 PCS','4X75 - 200 PCS','Fasteners & Ironmongery','p09-18.jpg','image/jpeg',91513,'static:/wholesale-products/p09-18.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-18.jpg', image_type='image/jpeg', image_size=91513, image_key='static:/wholesale-products/p09-18.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC4075-200' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-DWC4075-500','DRYWALL SCREW 4X75 500 PCS','4X75 - 500 PCS','Fasteners & Ironmongery','p09-18.jpg','image/jpeg',91513,'static:/wholesale-products/p09-18.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-18.jpg', image_type='image/jpeg', image_size=91513, image_key='static:/wholesale-products/p09-18.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-DWC4075-500' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP1075-10','EXPANSION BOLT 10X75 10 PCS','10X75 - 10 PCS','Fasteners & Ironmongery','p09-19.jpg','image/jpeg',84660,'static:/wholesale-products/p09-19.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-19.jpg', image_type='image/jpeg', image_size=84660, image_key='static:/wholesale-products/p09-19.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP1075-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP1290-10','EXPANSION BOLT 12X90 10 PCS','12X90 - 10 PCS','Fasteners & Ironmongery','p09-19.jpg','image/jpeg',84660,'static:/wholesale-products/p09-19.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-19.jpg', image_type='image/jpeg', image_size=84660, image_key='static:/wholesale-products/p09-19.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP1290-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP6050-25','EXPANSION BOLT 6X50 25 PCS','6X50 - 25 PCS','Fasteners & Ironmongery','p09-19.jpg','image/jpeg',84660,'static:/wholesale-products/p09-19.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-19.jpg', image_type='image/jpeg', image_size=84660, image_key='static:/wholesale-products/p09-19.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP6050-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP8065-25','EXPANSION BOLT 8X65 25 PCS','8X65 - 25 PCS','Fasteners & Ironmongery','p09-19.jpg','image/jpeg',84660,'static:/wholesale-products/p09-19.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-19.jpg', image_type='image/jpeg', image_size=84660, image_key='static:/wholesale-products/p09-19.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP8065-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP6050-2','EXPANSION BOLT 6X50 2 PCS','6X50 - 2 PCS','Fasteners & Ironmongery','p09-20.jpg','image/jpeg',93096,'static:/wholesale-products/p09-20.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-20.jpg', image_type='image/jpeg', image_size=93096, image_key='static:/wholesale-products/p09-20.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP6050-2' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP6050-4','EXPANSION BOLT 6X50 4 PCS','6X50 - 4 PCS','Fasteners & Ironmongery','p09-20.jpg','image/jpeg',93096,'static:/wholesale-products/p09-20.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-20.jpg', image_type='image/jpeg', image_size=93096, image_key='static:/wholesale-products/p09-20.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP6050-4' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP6050-10','EXPANSION BOLT 6X50 10 PCS','6X50 - 10 PCS','Fasteners & Ironmongery','p09-20.jpg','image/jpeg',93096,'static:/wholesale-products/p09-20.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-20.jpg', image_type='image/jpeg', image_size=93096, image_key='static:/wholesale-products/p09-20.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP6050-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP8065-2','EXPANSION BOLT 8X65 2 PCS','8X65 - 2 PCS','Fasteners & Ironmongery','p09-20.jpg','image/jpeg',93096,'static:/wholesale-products/p09-20.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-20.jpg', image_type='image/jpeg', image_size=93096, image_key='static:/wholesale-products/p09-20.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP8065-2' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP8065-4','EXPANSION BOLT 8X65 4 PCS','8X65 - 4 PCS','Fasteners & Ironmongery','p09-20.jpg','image/jpeg',93096,'static:/wholesale-products/p09-20.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-20.jpg', image_type='image/jpeg', image_size=93096, image_key='static:/wholesale-products/p09-20.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP8065-4' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP9065-10','EXPANSION BOLT 9X65 10 PCS','9X65 - 10 PCS','Fasteners & Ironmongery','p09-20.jpg','image/jpeg',93096,'static:/wholesale-products/p09-20.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-20.jpg', image_type='image/jpeg', image_size=93096, image_key='static:/wholesale-products/p09-20.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP9065-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP1075-2','EXPANSION BOLT 10X75 2 PCS','10X75 - 2 PCS','Fasteners & Ironmongery','p09-21.jpg','image/jpeg',92542,'static:/wholesale-products/p09-21.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-21.jpg', image_type='image/jpeg', image_size=92542, image_key='static:/wholesale-products/p09-21.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP1075-2' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP1075-4','EXPANSION BOLT 10X75 4 PCS','10X75 - 4 PCS','Fasteners & Ironmongery','p09-21.jpg','image/jpeg',92542,'static:/wholesale-products/p09-21.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-21.jpg', image_type='image/jpeg', image_size=92542, image_key='static:/wholesale-products/p09-21.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP1075-4' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP1290-2','EXPANSION BOLT 12X90 2 PCS','12X90 - 2 PCS','Fasteners & Ironmongery','p09-21.jpg','image/jpeg',92542,'static:/wholesale-products/p09-21.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-21.jpg', image_type='image/jpeg', image_size=92542, image_key='static:/wholesale-products/p09-21.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP1290-2' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-EXP1290-4','EXPANSION BOLT 12X90 4 PCS','12X90 - 4 PCS','Fasteners & Ironmongery','p09-21.jpg','image/jpeg',92542,'static:/wholesale-products/p09-21.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-21.jpg', image_type='image/jpeg', image_size=92542, image_key='static:/wholesale-products/p09-21.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-EXP1290-4' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-TKS5520-100','TEK SCREW 5.5X20 100 PCS','5.5X20 - 100 PCS','Fasteners & Ironmongery','p09-22.jpg','image/jpeg',110594,'static:/wholesale-products/p09-22.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-22.jpg', image_type='image/jpeg', image_size=110594, image_key='static:/wholesale-products/p09-22.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-TKS5520-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-TKS5525-100','TEK SCREW 5.5X25 100 PCS','5.5X25 - 100 PCS','Fasteners & Ironmongery','p09-22.jpg','image/jpeg',110594,'static:/wholesale-products/p09-22.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-22.jpg', image_type='image/jpeg', image_size=110594, image_key='static:/wholesale-products/p09-22.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-TKS5525-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-TKS5530-100','TEK SCREW 5.5X30 100 PCS','5.5X30 - 100 PCS','Fasteners & Ironmongery','p09-22.jpg','image/jpeg',110594,'static:/wholesale-products/p09-22.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-22.jpg', image_type='image/jpeg', image_size=110594, image_key='static:/wholesale-products/p09-22.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-TKS5530-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-TKS5540-100','TEK SCREW 5.5X40 100 PCS','5.5X40 - 100 PCS','Fasteners & Ironmongery','p09-22.jpg','image/jpeg',110594,'static:/wholesale-products/p09-22.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-22.jpg', image_type='image/jpeg', image_size=110594, image_key='static:/wholesale-products/p09-22.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-TKS5540-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-TKS5550-100','TEK SCREW 5.5X50 100 PCS','5.5X50 - 100 PCS','Fasteners & Ironmongery','p09-22.jpg','image/jpeg',110594,'static:/wholesale-products/p09-22.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-22.jpg', image_type='image/jpeg', image_size=110594, image_key='static:/wholesale-products/p09-22.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-TKS5550-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5035-50','NAIL IN ANCHOR 5X35 50 PCS','5X35 - 50 PCS','Fasteners & Ironmongery','p09-23.jpg','image/jpeg',119816,'static:/wholesale-products/p09-23.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-23.jpg', image_type='image/jpeg', image_size=119816, image_key='static:/wholesale-products/p09-23.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA5035-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5035-100','NAIL IN ANCHOR 5X35 100 PCS','5X35 - 100 PCS','Fasteners & Ironmongery','p09-23.jpg','image/jpeg',119816,'static:/wholesale-products/p09-23.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-23.jpg', image_type='image/jpeg', image_size=119816, image_key='static:/wholesale-products/p09-23.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA5035-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5050-50','NAIL IN ANCHOR 5X50 50 PCS','5X50 - 50 PCS','Fasteners & Ironmongery','p09-23.jpg','image/jpeg',119816,'static:/wholesale-products/p09-23.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-23.jpg', image_type='image/jpeg', image_size=119816, image_key='static:/wholesale-products/p09-23.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA5050-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5050-100','NAIL IN ANCHOR 5X50 100 PCS','5X50 - 100 PCS','Fasteners & Ironmongery','p09-23.jpg','image/jpeg',119816,'static:/wholesale-products/p09-23.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-23.jpg', image_type='image/jpeg', image_size=119816, image_key='static:/wholesale-products/p09-23.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA5050-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6035-50','NAIL IN ANCHOR 6X35 50 PCS','6X35 - 50 PCS','Fasteners & Ironmongery','p09-23.jpg','image/jpeg',119816,'static:/wholesale-products/p09-23.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-23.jpg', image_type='image/jpeg', image_size=119816, image_key='static:/wholesale-products/p09-23.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6035-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6035-100','NAIL IN ANCHOR 6X35 100 PCS','6X35 - 100 PCS','Fasteners & Ironmongery','p09-23.jpg','image/jpeg',119816,'static:/wholesale-products/p09-23.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-23.jpg', image_type='image/jpeg', image_size=119816, image_key='static:/wholesale-products/p09-23.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6035-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6045-50','NAIL IN ANCHOR 6X45 50 PCS','6X45 - 50 PCS','Fasteners & Ironmongery','p09-24.jpg','image/jpeg',120562,'static:/wholesale-products/p09-24.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-24.jpg', image_type='image/jpeg', image_size=120562, image_key='static:/wholesale-products/p09-24.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6045-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6045-100','NAIL IN ANCHOR 6X45 100 PCS','6X45 - 100 PCS','Fasteners & Ironmongery','p09-24.jpg','image/jpeg',120562,'static:/wholesale-products/p09-24.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-24.jpg', image_type='image/jpeg', image_size=120562, image_key='static:/wholesale-products/p09-24.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6045-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6055-50','NAIL IN ANCHOR 6X55 50 PCS','6X55 - 50 PCS','Fasteners & Ironmongery','p09-24.jpg','image/jpeg',120562,'static:/wholesale-products/p09-24.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-24.jpg', image_type='image/jpeg', image_size=120562, image_key='static:/wholesale-products/p09-24.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6055-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6070-50','NAIL IN ANCHOR 6X70 50 PCS','6X70 - 50 PCS','Fasteners & Ironmongery','p09-24.jpg','image/jpeg',120562,'static:/wholesale-products/p09-24.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-24.jpg', image_type='image/jpeg', image_size=120562, image_key='static:/wholesale-products/p09-24.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6070-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6070-100','NAIL IN ANCHOR 6X70 100 PCS','6X70 - 100 PCS','Fasteners & Ironmongery','p09-24.jpg','image/jpeg',120562,'static:/wholesale-products/p09-24.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-24.jpg', image_type='image/jpeg', image_size=120562, image_key='static:/wholesale-products/p09-24.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6070-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA8060-50','NAIL IN ANCHOR 8X60 50 PCS','8X60 - 50 PCS','Fasteners & Ironmongery','p09-25.jpg','image/jpeg',118260,'static:/wholesale-products/p09-25.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-25.jpg', image_type='image/jpeg', image_size=118260, image_key='static:/wholesale-products/p09-25.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA8060-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA8060-100','NAIL IN ANCHOR 8X60 100 PCS','8X60 - 100 PCS','Fasteners & Ironmongery','p09-25.jpg','image/jpeg',118260,'static:/wholesale-products/p09-25.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-25.jpg', image_type='image/jpeg', image_size=118260, image_key='static:/wholesale-products/p09-25.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA8060-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA8080-50','NAIL IN ANCHOR 8X80 50 PCS','8X80 - 50 PCS','Fasteners & Ironmongery','p09-25.jpg','image/jpeg',118260,'static:/wholesale-products/p09-25.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-25.jpg', image_type='image/jpeg', image_size=118260, image_key='static:/wholesale-products/p09-25.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA8080-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA8080-100','NAIL IN ANCHOR 8X80 100 PCS','8X80 - 100 PCS','Fasteners & Ironmongery','p09-25.jpg','image/jpeg',118260,'static:/wholesale-products/p09-25.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-25.jpg', image_type='image/jpeg', image_size=118260, image_key='static:/wholesale-products/p09-25.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA8080-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA80100-50','NAIL IN ANCHOR 8X100 50 PCS','8X100 - 50 PCS','Fasteners & Ironmongery','p09-25.jpg','image/jpeg',118260,'static:/wholesale-products/p09-25.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-25.jpg', image_type='image/jpeg', image_size=118260, image_key='static:/wholesale-products/p09-25.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA80100-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA80100-100','NAIL IN ANCHOR 8X100 10 PCS (as printed in source)','8X100 - 10 PCS (as printed in source)','Fasteners & Ironmongery','p09-25.jpg','image/jpeg',118260,'static:/wholesale-products/p09-25.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p09-25.jpg', image_type='image/jpeg', image_size=118260, image_key='static:/wholesale-products/p09-25.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA80100-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5035-5','NAIL IN ANCHOR 5X35 5 PCS','5X35 - 5 PCS','Fasteners & Ironmongery','p10f-01.jpg','image/jpeg',78411,'static:/wholesale-products/p10f-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-01.jpg', image_type='image/jpeg', image_size=78411, image_key='static:/wholesale-products/p10f-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA5035-5' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5035-10','NAIL IN ANCHOR 5X35 10 PCS','5X35 - 10 PCS','Fasteners & Ironmongery','p10f-01.jpg','image/jpeg',78411,'static:/wholesale-products/p10f-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-01.jpg', image_type='image/jpeg', image_size=78411, image_key='static:/wholesale-products/p10f-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA5035-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5050-10','NAIL IN ANCHOR 5X50 10 PCS','5X50 - 10 PCS','Fasteners & Ironmongery','p10f-01.jpg','image/jpeg',78411,'static:/wholesale-products/p10f-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-01.jpg', image_type='image/jpeg', image_size=78411, image_key='static:/wholesale-products/p10f-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA5050-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5050-15','NAIL IN ANCHOR 5X50 15 PCS','5X50 - 15 PCS','Fasteners & Ironmongery','p10f-01.jpg','image/jpeg',78411,'static:/wholesale-products/p10f-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-01.jpg', image_type='image/jpeg', image_size=78411, image_key='static:/wholesale-products/p10f-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA5050-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6035-5','NAIL IN ANCHOR 6X35 5 PCS','6X35 - 5 PCS','Fasteners & Ironmongery','p10f-02.jpg','image/jpeg',77595,'static:/wholesale-products/p10f-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-02.jpg', image_type='image/jpeg', image_size=77595, image_key='static:/wholesale-products/p10f-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6035-5' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6035-10','NAIL IN ANCHOR 6X35 10 PCS','6X35 - 10 PCS','Fasteners & Ironmongery','p10f-02.jpg','image/jpeg',77595,'static:/wholesale-products/p10f-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-02.jpg', image_type='image/jpeg', image_size=77595, image_key='static:/wholesale-products/p10f-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6035-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6035-15','NAIL IN ANCHOR 6X35 15 PCS','6X35 - 15 PCS','Fasteners & Ironmongery','p10f-02.jpg','image/jpeg',77595,'static:/wholesale-products/p10f-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-02.jpg', image_type='image/jpeg', image_size=77595, image_key='static:/wholesale-products/p10f-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6035-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6045-5','NAIL IN ANCHOR 6X45 5 PCS','6X45 - 5 PCS','Fasteners & Ironmongery','p10f-02.jpg','image/jpeg',77595,'static:/wholesale-products/p10f-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-02.jpg', image_type='image/jpeg', image_size=77595, image_key='static:/wholesale-products/p10f-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6045-5' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6045-10','NAIL IN ANCHOR 6X45 10 PCS','6X45 - 10 PCS','Fasteners & Ironmongery','p10f-02.jpg','image/jpeg',77595,'static:/wholesale-products/p10f-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-02.jpg', image_type='image/jpeg', image_size=77595, image_key='static:/wholesale-products/p10f-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6045-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6045-15','NAIL IN ANCHOR 6X45 15 PCS','6X45 - 15 PCS','Fasteners & Ironmongery','p10f-02.jpg','image/jpeg',77595,'static:/wholesale-products/p10f-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-02.jpg', image_type='image/jpeg', image_size=77595, image_key='static:/wholesale-products/p10f-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6045-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6055-5','NAIL IN ANCHOR 6X55 5 PCS','6X55 - 5 PCS','Fasteners & Ironmongery','p10f-03.jpg','image/jpeg',77478,'static:/wholesale-products/p10f-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-03.jpg', image_type='image/jpeg', image_size=77478, image_key='static:/wholesale-products/p10f-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6055-5' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6055-10','NAIL IN ANCHOR 6X55 10 PCS','6X55 - 10 PCS','Fasteners & Ironmongery','p10f-03.jpg','image/jpeg',77478,'static:/wholesale-products/p10f-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-03.jpg', image_type='image/jpeg', image_size=77478, image_key='static:/wholesale-products/p10f-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6055-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6055-15','NAIL IN ANCHOR 6X55 15 PCS','6X55 - 15 PCS','Fasteners & Ironmongery','p10f-03.jpg','image/jpeg',77478,'static:/wholesale-products/p10f-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-03.jpg', image_type='image/jpeg', image_size=77478, image_key='static:/wholesale-products/p10f-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6055-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6070-5','NAIL IN ANCHOR 6X70 5 PCS','6X70 - 5 PCS','Fasteners & Ironmongery','p10f-03.jpg','image/jpeg',77478,'static:/wholesale-products/p10f-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-03.jpg', image_type='image/jpeg', image_size=77478, image_key='static:/wholesale-products/p10f-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6070-5' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6070-10','NAIL IN ANCHOR 6X70 10 PCS','6X70 - 10 PCS','Fasteners & Ironmongery','p10f-03.jpg','image/jpeg',77478,'static:/wholesale-products/p10f-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-03.jpg', image_type='image/jpeg', image_size=77478, image_key='static:/wholesale-products/p10f-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6070-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6070-15','NAIL IN ANCHOR 6X70 15 PCS','6X70 - 15 PCS','Fasteners & Ironmongery','p10f-03.jpg','image/jpeg',77478,'static:/wholesale-products/p10f-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-03.jpg', image_type='image/jpeg', image_size=77478, image_key='static:/wholesale-products/p10f-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA6070-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA8060-5','NAIL IN ANCHOR 8X60 5 PCS','8X60 - 5 PCS','Fasteners & Ironmongery','p10f-04.jpg','image/jpeg',77627,'static:/wholesale-products/p10f-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-04.jpg', image_type='image/jpeg', image_size=77627, image_key='static:/wholesale-products/p10f-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA8060-5' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA8060-10','NAIL IN ANCHOR 8X60 10 PCS','8X60 - 10 PCS','Fasteners & Ironmongery','p10f-04.jpg','image/jpeg',77627,'static:/wholesale-products/p10f-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-04.jpg', image_type='image/jpeg', image_size=77627, image_key='static:/wholesale-products/p10f-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA8060-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA8060-15','NAIL IN ANCHOR 8X60 15 PCS','8X60 - 15 PCS','Fasteners & Ironmongery','p10f-04.jpg','image/jpeg',77627,'static:/wholesale-products/p10f-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-04.jpg', image_type='image/jpeg', image_size=77627, image_key='static:/wholesale-products/p10f-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA8060-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA8080-5','NAIL IN ANCHOR 8X80 5 PCS','8X80 - 5 PCS','Fasteners & Ironmongery','p10f-04.jpg','image/jpeg',77627,'static:/wholesale-products/p10f-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-04.jpg', image_type='image/jpeg', image_size=77627, image_key='static:/wholesale-products/p10f-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA8080-5' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA8080-10','NAIL IN ANCHOR 8X80 10 PCS','8X80 - 10 PCS','Fasteners & Ironmongery','p10f-04.jpg','image/jpeg',77627,'static:/wholesale-products/p10f-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-04.jpg', image_type='image/jpeg', image_size=77627, image_key='static:/wholesale-products/p10f-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA8080-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA8080-15','NAIL IN ANCHOR 8X80 15 PCS','8X80 - 15 PCS','Fasteners & Ironmongery','p10f-04.jpg','image/jpeg',77627,'static:/wholesale-products/p10f-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-04.jpg', image_type='image/jpeg', image_size=77627, image_key='static:/wholesale-products/p10f-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA8080-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA80100-5','NAIL IN ANCHOR 8X100 5 PCS','8X100 - 5 PCS','Fasteners & Ironmongery','p10f-05.jpg','image/jpeg',77472,'static:/wholesale-products/p10f-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-05.jpg', image_type='image/jpeg', image_size=77472, image_key='static:/wholesale-products/p10f-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA80100-5' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA80100-10','NAIL IN ANCHOR 8X100 10 PCS','8X100 - 10 PCS','Fasteners & Ironmongery','p10f-05.jpg','image/jpeg',77472,'static:/wholesale-products/p10f-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-05.jpg', image_type='image/jpeg', image_size=77472, image_key='static:/wholesale-products/p10f-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA80100-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA80100-15','NAIL IN ANCHOR 8X100 15 PCS','8X100 - 15 PCS','Fasteners & Ironmongery','p10f-05.jpg','image/jpeg',77472,'static:/wholesale-products/p10f-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-05.jpg', image_type='image/jpeg', image_size=77472, image_key='static:/wholesale-products/p10f-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA80100-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA80120-5','NAIL IN ANCHOR 8X120 5 PCS','8X120 - 5 PCS','Fasteners & Ironmongery','p10f-05.jpg','image/jpeg',77472,'static:/wholesale-products/p10f-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-05.jpg', image_type='image/jpeg', image_size=77472, image_key='static:/wholesale-products/p10f-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA80120-5' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA80120-10','NAIL IN ANCHOR 8X120 10 PCS','8X120 - 10 PCS','Fasteners & Ironmongery','p10f-05.jpg','image/jpeg',77472,'static:/wholesale-products/p10f-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-05.jpg', image_type='image/jpeg', image_size=77472, image_key='static:/wholesale-products/p10f-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA80120-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA80120-15','NAIL IN ANCHOR 8X120 15 PCS','8X120 - 15 PCS','Fasteners & Ironmongery','p10f-05.jpg','image/jpeg',77472,'static:/wholesale-products/p10f-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-05.jpg', image_type='image/jpeg', image_size=77472, image_key='static:/wholesale-products/p10f-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-NA80120-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-SQW10-200','SQUARE WASHER 10 200 PCS','10 - 200 PCS','Fasteners & Ironmongery','p10f-06.jpg','image/jpeg',75319,'static:/wholesale-products/p10f-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-06.jpg', image_type='image/jpeg', image_size=75319, image_key='static:/wholesale-products/p10f-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-SQW10-200' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-SQW12-25','SQUARE WASHER 12 25 PCS','12 - 25 PCS','Fasteners & Ironmongery','p10f-06.jpg','image/jpeg',75319,'static:/wholesale-products/p10f-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-06.jpg', image_type='image/jpeg', image_size=75319, image_key='static:/wholesale-products/p10f-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-SQW12-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-SQW12-100','SQUARE WASHER 12 100 PCS','12 - 100 PCS','Fasteners & Ironmongery','p10f-06.jpg','image/jpeg',75319,'static:/wholesale-products/p10f-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-06.jpg', image_type='image/jpeg', image_size=75319, image_key='static:/wholesale-products/p10f-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-SQW12-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-SQW10-10','SQUARE WASHER 10 10 PCS','10 - 10 PCS','Fasteners & Ironmongery','p10f-07.jpg','image/jpeg',72626,'static:/wholesale-products/p10f-07.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-07.jpg', image_type='image/jpeg', image_size=72626, image_key='static:/wholesale-products/p10f-07.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-SQW10-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-SQW10-25','SQUARE WASHER 10 25 PCS','10 - 25 PCS','Fasteners & Ironmongery','p10f-07.jpg','image/jpeg',72626,'static:/wholesale-products/p10f-07.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-07.jpg', image_type='image/jpeg', image_size=72626, image_key='static:/wholesale-products/p10f-07.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-SQW10-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-SQW12-10','SQUARE WASHER 12 10 PCS','12 - 10 PCS','Fasteners & Ironmongery','p10f-07.jpg','image/jpeg',72626,'static:/wholesale-products/p10f-07.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-07.jpg', image_type='image/jpeg', image_size=72626, image_key='static:/wholesale-products/p10f-07.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-SQW12-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-GWP11-25','GREEN WALL PLUG 11 25 PCS','11 - 25 PCS','Fasteners & Ironmongery','p10f-08.jpg','image/jpeg',90390,'static:/wholesale-products/p10f-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-08.jpg', image_type='image/jpeg', image_size=90390, image_key='static:/wholesale-products/p10f-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-GWP11-25' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-GWP11-50','GREEN WALL PLUG 11 50 PCS','11 - 50 PCS','Fasteners & Ironmongery','p10f-08.jpg','image/jpeg',90390,'static:/wholesale-products/p10f-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-08.jpg', image_type='image/jpeg', image_size=90390, image_key='static:/wholesale-products/p10f-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-GWP11-50' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-GWP11-100','GREEN WALL PLUG 11 100 PCS','11 - 100 PCS','Fasteners & Ironmongery','p10f-08.jpg','image/jpeg',90390,'static:/wholesale-products/p10f-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10f-08.jpg', image_type='image/jpeg', image_size=90390, image_key='static:/wholesale-products/p10f-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='TF-GWP11-100' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PT66','ALUMINIUM WINDOW PT66','ALUMINIUM WINDOW PT66','Windows','p10w-01.jpg','image/jpeg',49736,'static:/wholesale-products/p10w-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-01.jpg', image_type='image/jpeg', image_size=49736, image_key='static:/wholesale-products/p10w-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PT66' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PT66 OBS','ALUMINIUM WINDOW PT66 OBS','ALUMINIUM WINDOW PT66 OBS','Windows','p10w-01.jpg','image/jpeg',49736,'static:/wholesale-products/p10w-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-01.jpg', image_type='image/jpeg', image_size=49736, image_key='static:/wholesale-products/p10w-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PT66 OBS' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PT66 H/D','ALUMINIUM WINDOW PT66 H/D','ALUMINIUM WINDOW PT66 H/D','Windows','p10w-01.jpg','image/jpeg',49736,'static:/wholesale-products/p10w-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-01.jpg', image_type='image/jpeg', image_size=49736, image_key='static:/wholesale-products/p10w-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PT66 H/D' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PT99','ALUMINIUM WINDOW PT99','ALUMINIUM WINDOW PT99','Windows','p10w-02.jpg','image/jpeg',57674,'static:/wholesale-products/p10w-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-02.jpg', image_type='image/jpeg', image_size=57674, image_key='static:/wholesale-products/p10w-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PT99' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PT99 OBS','ALUMINIUM WINDOW PT99 OBS','ALUMINIUM WINDOW PT99 OBS','Windows','p10w-02.jpg','image/jpeg',57674,'static:/wholesale-products/p10w-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-02.jpg', image_type='image/jpeg', image_size=57674, image_key='static:/wholesale-products/p10w-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PT99 OBS' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PT129','ALUMINIUM WINDOW PT129','ALUMINIUM WINDOW PT129','Windows','p10w-03.jpg','image/jpeg',32487,'static:/wholesale-products/p10w-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-03.jpg', image_type='image/jpeg', image_size=32487, image_key='static:/wholesale-products/p10w-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PT129' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PT126','ALUMINIUM WINDOW PT126','ALUMINIUM WINDOW PT126','Windows','p10w-04.jpg','image/jpeg',31201,'static:/wholesale-products/p10w-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-04.jpg', image_type='image/jpeg', image_size=31201, image_key='static:/wholesale-products/p10w-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PT126' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PTT126','ALUMINIUM WINDOW PTT126','ALUMINIUM WINDOW PTT126','Windows','p10w-05.jpg','image/jpeg',39953,'static:/wholesale-products/p10w-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-05.jpg', image_type='image/jpeg', image_size=39953, image_key='static:/wholesale-products/p10w-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PTT126' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PT612','ALUMINIUM WINDOW PT612','ALUMINIUM WINDOW PT612','Windows','p10w-06.jpg','image/jpeg',35264,'static:/wholesale-products/p10w-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-06.jpg', image_type='image/jpeg', image_size=35264, image_key='static:/wholesale-products/p10w-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PT612' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PT1212','ALUMINIUM WINDOW PT1212','ALUMINIUM WINDOW PT1212','Windows','p10w-07.jpg','image/jpeg',51913,'static:/wholesale-products/p10w-07.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-07.jpg', image_type='image/jpeg', image_size=51913, image_key='static:/wholesale-products/p10w-07.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PT1212' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PT1515','ALUMINIUM WINDOW PT1515','ALUMINIUM WINDOW PT1515','Windows','p10w-08.jpg','image/jpeg',59358,'static:/wholesale-products/p10w-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-08.jpg', image_type='image/jpeg', image_size=59358, image_key='static:/wholesale-products/p10w-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PT1515' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('P4TT1515','ALUMINIUM WINDOW P4TT1515','ALUMINIUM WINDOW P4TT1515','Windows','p10w-09.jpg','image/jpeg',62401,'static:/wholesale-products/p10w-09.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-09.jpg', image_type='image/jpeg', image_size=62401, image_key='static:/wholesale-products/p10w-09.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='P4TT1515' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PTT159','ALUMINIUM WINDOW PTT159','ALUMINIUM WINDOW PTT159','Windows','p10w-10.jpg','image/jpeg',44123,'static:/wholesale-products/p10w-10.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-10.jpg', image_type='image/jpeg', image_size=44123, image_key='static:/wholesale-products/p10w-10.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PTT159' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PT69 OBS','ALUMINIUM WINDOW PT69 OBS','ALUMINIUM WINDOW PT69 OBS','Windows','p10w-11.jpg','image/jpeg',97245,'static:/wholesale-products/p10w-11.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-11.jpg', image_type='image/jpeg', image_size=97245, image_key='static:/wholesale-products/p10w-11.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PT69 OBS' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PT69','ALUMINIUM WINDOW PT69','ALUMINIUM WINDOW PT69','Windows','p10w-13.jpg','image/jpeg',102000,'static:/wholesale-products/p10w-13.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p10w-13.jpg', image_type='image/jpeg', image_size=102000, image_key='static:/wholesale-products/p10w-13.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='PT69' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-01','DRIPP VALUE KOTE','DRIPP VALUE KOTE - sizes shown in original wholesale catalogue: 5L / 20L.','Paints & Allied','p11-01.jpg','image/jpeg',87916,'static:/wholesale-products/p11-01.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-01.jpg', image_type='image/jpeg', image_size=87916, image_key='static:/wholesale-products/p11-01.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-01' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-02','DRIPP EXPERT KOTE','DRIPP EXPERT KOTE - sizes shown in original wholesale catalogue: 5L / 20L.','Paints & Allied','p11-02.jpg','image/jpeg',94665,'static:/wholesale-products/p11-02.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-02.jpg', image_type='image/jpeg', image_size=94665, image_key='static:/wholesale-products/p11-02.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-02' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-03','DRIPP SHEEN SUPER ACRYLIC','DRIPP SHEEN SUPER ACRYLIC - sizes shown in original wholesale catalogue: 5L / 20L.','Paints & Allied','p11-03.jpg','image/jpeg',94807,'static:/wholesale-products/p11-03.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-03.jpg', image_type='image/jpeg', image_size=94807, image_key='static:/wholesale-products/p11-03.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-03' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-04','DRIPP ROOF KOTE','DRIPP ROOF KOTE - sizes shown in original wholesale catalogue: 5L / 20L.','Paints & Allied','p11-04.jpg','image/jpeg',83546,'static:/wholesale-products/p11-04.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-04.jpg', image_type='image/jpeg', image_size=83546, image_key='static:/wholesale-products/p11-04.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-04' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-05','DRIPP MULTI KOTE','DRIPP MULTI KOTE - sizes shown in original wholesale catalogue: 5L / 20L.','Paints & Allied','p11-05.jpg','image/jpeg',90003,'static:/wholesale-products/p11-05.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-05.jpg', image_type='image/jpeg', image_size=90003, image_key='static:/wholesale-products/p11-05.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-05' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-06','DRIPP LIQUID RUBBER','DRIPP LIQUID RUBBER - sizes shown in original wholesale catalogue: 5L / 20L.','Paints & Allied','p11-06.jpg','image/jpeg',83706,'static:/wholesale-products/p11-06.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-06.jpg', image_type='image/jpeg', image_size=83706, image_key='static:/wholesale-products/p11-06.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-06' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-07','DRIPP GLAMOUR STONE','DRIPP GLAMOUR STONE - sizes shown in original wholesale catalogue: 5L / 20L.','Paints & Allied','p11-07.jpg','image/jpeg',83667,'static:/wholesale-products/p11-07.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-07.jpg', image_type='image/jpeg', image_size=83667, image_key='static:/wholesale-products/p11-07.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-07' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-08','DRIPP HI-HIDING','DRIPP HI-HIDING - sizes shown in original wholesale catalogue: 5L / 20L.','Paints & Allied','p11-08.jpg','image/jpeg',89979,'static:/wholesale-products/p11-08.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-08.jpg', image_type='image/jpeg', image_size=89979, image_key='static:/wholesale-products/p11-08.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-08' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-09','ECOSTAR WHITE ACRYLIC PVA','ECOSTAR WHITE ACRYLIC PVA - sizes shown in original wholesale catalogue: 5L / 20L.','Paints & Allied','p11-09.jpg','image/jpeg',77300,'static:/wholesale-products/p11-09.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-09.jpg', image_type='image/jpeg', image_size=77300, image_key='static:/wholesale-products/p11-09.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-09' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-10','DRIPP ACRYLIC WATERPROOF','DRIPP ACRYLIC WATERPROOF - sizes shown in original wholesale catalogue: 5L.','Paints & Allied','p11-10.jpg','image/jpeg',63308,'static:/wholesale-products/p11-10.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-10.jpg', image_type='image/jpeg', image_size=63308, image_key='static:/wholesale-products/p11-10.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-10' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-11','NASCA SPRAY ASSORTED','NASCA SPRAY ASSORTED - sizes shown in original wholesale catalogue: ASSORTED.','Paints & Allied','p11-11.jpg','image/jpeg',125067,'static:/wholesale-products/p11-11.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-11.jpg', image_type='image/jpeg', image_size=125067, image_key='static:/wholesale-products/p11-11.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-11' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-12','FIBRE FLEX','FIBRE FLEX - sizes shown in original wholesale catalogue: 5L / 20L.','Paints & Allied','p11-12.jpg','image/jpeg',51649,'static:/wholesale-products/p11-12.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-12.jpg', image_type='image/jpeg', image_size=51649, image_key='static:/wholesale-products/p11-12.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-12' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-13','SUPREME COAT ACRYLIC PVA','SUPREME COAT ACRYLIC PVA - sizes shown in original wholesale catalogue: 5L / 20L.','Paints & Allied','p11-13.jpg','image/jpeg',93503,'static:/wholesale-products/p11-13.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-13.jpg', image_type='image/jpeg', image_size=93503, image_key='static:/wholesale-products/p11-13.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-13' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-14','FLASH HARRY WATERPROOF FIX A LEAK','FLASH HARRY WATERPROOF FIX A LEAK - sizes shown in original wholesale catalogue: 5L.','Paints & Allied','p11-14.jpg','image/jpeg',45714,'static:/wholesale-products/p11-14.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-14.jpg', image_type='image/jpeg', image_size=45714, image_key='static:/wholesale-products/p11-14.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-14' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WHPDF-P11-15','SUPER 2000 ACRYLIC PVA','SUPER 2000 ACRYLIC PVA - sizes shown in original wholesale catalogue: 5L / 20L.','Paints & Allied','p11-15.jpg','image/jpeg',53262,'static:/wholesale-products/p11-15.jpg',1,'system:wholesale-original-pdf',datetime('now'),'system:wholesale-original-pdf',datetime('now'));
--> statement-breakpoint
UPDATE catalogue_products SET image_name='p11-15.jpg', image_type='image/jpeg', image_size=53262, image_key='static:/wholesale-products/p11-15.jpg', updated_by='system:wholesale-original-pdf', updated_at=datetime('now') WHERE code='WHPDF-P11-15' AND (image_key='' OR image_key IS NULL);
--> statement-breakpoint
