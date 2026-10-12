CREATE TABLE IF NOT EXISTS catalogue_products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  image_name TEXT NOT NULL DEFAULT '',
  image_type TEXT NOT NULL DEFAULT '',
  image_size INTEGER NOT NULL DEFAULT 0,
  image_key TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_by TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS catalogue_products_active_name_idx ON catalogue_products(active,name);
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('SWH001','1.5 M SHOWER HOSE SS - 26642','1.5 M SHOWER HOSE SS - 26642','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('STAND002','1.8 PEG BOARD STAND','1.8 PEG BOARD STAND','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0032','10 PCE CANDY COLOR CLOTHES HANGERS','10 PCE CANDY COLOR CLOTHES HANGERS','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('619121','100ML STAINERS BLACK','100ML STAINERS BLACK','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('619153','100ML STAINERS BLUE','100ML STAINERS BLUE','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('619167','100ML STAINERS BRIGHT YELLOW','100ML STAINERS BRIGHT YELLOW','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('619135','100ML STAINERS BROWN','100ML STAINERS BROWN','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('69651','100ML STAINERS GREEN','100ML STAINERS GREEN','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('619172','100ML STAINERS RED','100ML STAINERS RED','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('DYE01','100ML STAINERS VIOLET PURPLE','100ML STAINERS VIOLET PURPLE','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CCF005','10MM CABLE CLIP FLT','10MM CABLE CLIP FLT','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CCR002','10MM CABLE CLIP RND','10MM CABLE CLIP RND','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RWGC10X85','10MM GLASS BIT CARDED','10MM GLASS BIT CARDED','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('KD0001','10PC KITCHEN DRAWER ORGANIZER - A-556','10PC KITCHEN DRAWER ORGANIZER - A-556','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RUW33SET10PS','10PCE COMBO SET BRICK/STANDARD METAL','10PCE COMBO SET BRICK/STANDARD METAL','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUFPC','110 FLEXI PAN CONNECTOR','110 FLEXI PAN CONNECTOR','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('7861801','110 PVC SV END CAP','110 PVC SV END CAP','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSB42','110 SV BEND 45 DEG','110 SV BEND 45 DEG','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('M075','110 SV BEND IE 45 DEG SANS','110 SV BEND IE 45 DEG SANS','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AE008','110 SV KIMBERLY SOCKET','110 SV KIMBERLY SOCKET','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUY41','110 U/G Y JUNCTION PLAIN','110 U/G Y JUNCTION PLAIN','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUDS110','110 UG UNIVERSAL SOCKET','110 UG UNIVERSAL SOCKET','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUB43','110 X 22.5 UG PL SHORT BEND','110 X 22.5 UG PL SHORT BEND','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSB44','110 X 45 DEG SV PLAIN','110 X 45 DEG SV PLAIN','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PUSUG45','110 X 45 DEG U.G PLAIN SHORT BEND','110 X 45 DEG U.G PLAIN SHORT BEND','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUB41','110 X 45 UG BEND PLAIN','110 X 45 UG BEND PLAIN','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUB44','110 X 45 UG IE ELBOW','110 X 45 UG IE ELBOW','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSE404','110 X 50 SV ECCENTRIC REDUCER','110 X 50 SV ECCENTRIC REDUCER','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSW41','110 X 50 SV IE JUNCTION','110 X 50 SV IE JUNCTION','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSW40','110 X 50 SV PLAIN JUNCTION','110 X 50 SV PLAIN JUNCTION','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSB400','110 X 50 SV VENT HORN BEND','110 X 50 SV VENT HORN BEND','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSW49','110 X 50 X 50 SV IE JUNCTION','110 X 50 X 50 SV IE JUNCTION','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSW48','110 X 50 X 50 SV JUNCTION','110 X 50 X 50 SV JUNCTION','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSB41','110 X 90 SV IE ELBOW','110 X 90 SV IE ELBOW','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSB40','110 X 90 SV PLAIN ELBOW','110 X 90 SV PLAIN ELBOW','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUB45','110 X 90 UG IE ELBOW','110 X 90 UG IE ELBOW','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUB42','110 X 90 UG PLAIN ELBOW','110 X 90 UG PLAIN ELBOW','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUE41','110 X EARTHENWARE ADAPTOR','110 X EARTHENWARE ADAPTOR','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUGG40','110 X GULLEY GRID ONLY 190MM','110 X GULLEY GRID ONLY 190MM','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUGA40','110 X GULLEY HEAD & GRATE','110 X GULLEY HEAD & GRATE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('110SV','110 X PIPE SV PVC 6 METRE WHITE','110 X PIPE SV PVC 6 METRE WHITE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('110N','110 X PIPE U/G PVC NON SABS 6 METRE','110 X PIPE U/G PVC NON SABS 6 METRE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('110S','110 X PIPE U/G PVC SABS 6 METRE','110 X PIPE U/G PVC SABS 6 METRE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUB110X22','110 X SV BEND 110X22.5 SHORT','110 X SV BEND 110X22.5 SHORT','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUST41','110 X SV BEND PAN CONNECTOR','110 X SV BEND PAN CONNECTOR','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSE401','110 X SV DOUBLE SOCKET','110 X SV DOUBLE SOCKET','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PUE012','110 X SV IE BEND PAN CONNECTOR','110 X SV IE BEND PAN CONNECTOR','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSY42','110 X SV IE TEE','110 X SV IE TEE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSY41','110 X SV PLAIN TEE','110 X SV PLAIN TEE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSE400','110 X SV SINGLE SOCKET','110 X SV SINGLE SOCKET','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSG40','110 X SV STR PAN CONNECTOR','110 X SV STR PAN CONNECTOR','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUSAV110','110 X SV VENT VALVE','110 X SV VENT VALVE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUSY41','110 X SV Y JUNCTION PLAIN','110 X SV Y JUNCTION PLAIN','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUEC110','110 X UG END CAP','110 X UG END CAP','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUGB40','110 X UG GULLEY P TRAP','110 X UG GULLEY P TRAP','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUK40','110 X UG KIMBERLY SOCKET','110 X UG KIMBERLY SOCKET','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUYA42','110 X UG L/H Y JUNCTION','110 X UG L/H Y JUNCTION','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUY42','110 X UG PLAIN TEE','110 X UG PLAIN TEE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUYA41','110 X UG R/H Y JUNCTION','110 X UG R/H Y JUNCTION','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUAP43','110 X UG RODDING EYE','110 X UG RODDING EYE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUE400','110 X UG SINGLE SOCKET','110 X UG SINGLE SOCKET','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUUYA43','110 X UG UNIVERSAL Y JUNCTION','110 X UG UNIVERSAL Y JUNCTION','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLU990','110MM 90 UG BEND PLAIN SABS','110MM 90 UG BEND PLAIN SABS','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLU074','110X45 SV PLAIN SHORT BEND','110X45 SV PLAIN SHORT BEND','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('STW001','12 PACK STEEL WOOL - 350-4','12 PACK STEEL WOOL - 350-4','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CP001','12 PC CARPENTERS PENCIL - H0648A - D031','12 PC CARPENTERS PENCIL - H0648A - D031','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RWBC61200','12.00MM WOOD BRAD CARDED','12.00MM WOOD BRAD CARDED','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RUW12X100X166','12.0MMX100X166 SDS PLUS','12.0MMX100X166 SDS PLUS','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RUW12X150X210','12.0MMX150X210 SDS-PLUS','12.0MMX150X210 SDS-PLUS','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CCR003','12MM CABLE CLIP','12MM CABLE CLIP','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CCF006','12MM CABLE CLIP FLT','12MM CABLE CLIP FLT','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TTD-NYLN12-5','12MM NYLOCK NUT (5)','12MM NYLOCK NUT (5)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MUG006','12PC CERAMIC CUP & SAUCER SET WHITE','12PC CERAMIC CUP & SAUCER SET WHITE','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RUW14X150X210','14.0MMX150X210 SDS-PLUS','14.0MMX150X210 SDS-PLUS','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('15WSTICKB22','15W LED STICK B22','15W LED STICK B22','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('15WSTICKE27','15W LED STICK E27','15W LED STICK E27','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RUW16X150X210','16.0MMX150X210 SDS-PLUS','16.0MMX150X210 SDS-PLUS','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('160S','160 X PIPE UG PVC SABS 6M CL51 SOCKETED','160 X PIPE UG PVC SABS 6M CL51 SOCKETED','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('160S PLAIN','160 X PIPE UG PVC SABS 6M PLAIN','160 X PIPE UG PVC SABS 6M PLAIN','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUEC112','160MM SV END CAP','160MM SV END CAP','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUEC111','160MM UG END CAP','160MM UG END CAP','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('08624161','160X110X45D UG JUNCTION','160X110X45D UG JUNCTION','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('08604150','160X45 UG EQ. JUNCTION','160X45 UG EQ. JUNCTION','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HSK06','16PC HOLESAW SET - BW0215 - D012','16PC HOLESAW SET - BW0215 - D012','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('UTILITY004','18MM UTILITY KNIFE - 13464-47','18MM UTILITY KNIFE - 13464-47','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RUW3310618COMBO','18PCE COMBO SET HSS/MAS/WOOD','18PCE COMBO SET HSS/MAS/WOOD','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('789457','18W 2 PIN LAMP G24D STRAIGHT','18W 2 PIN LAMP G24D STRAIGHT','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('SPP2561','1K SELF ETCH FILLER PRIMER 250ML','1K SELF ETCH FILLER PRIMER 250ML','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TUBH005','1L HEX TUB','1L HEX TUB','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('7860130','1ST CHOICE ROOF PAINT 20L ASSORTED','1ST CHOICE ROOF PAINT 20L ASSORTED','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HANDLE002','2 PC BARN DOOR HANDLES STAINLESS','2 PC BARN DOOR HANDLES STAINLESS','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HANDLE003','2 PC BARN DOOR HANDLES STAINLESS','2 PC BARN DOOR HANDLES STAINLESS','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HINGE004','2 PC BUTT HINGE STAINLESS STEEL','2 PC BUTT HINGE STAINLESS STEEL','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HINGE005','2 PC BUTT HINGE STAINLESS STEEL 45MM','2 PC BUTT HINGE STAINLESS STEEL 45MM','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0060','2 PC HOOKS BLACK MEDIUM','2 PC HOOKS BLACK MEDIUM','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0059','2 PC HOOKS BLACK SMALL','2 PC HOOKS BLACK SMALL','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TG004','2 PC MAGNETIC CATCH BROWN','2 PC MAGNETIC CATCH BROWN','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TG003','2 PC MAGNETIC CATCH WHITE','2 PC MAGNETIC CATCH WHITE','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BASKET005','2 PC RATTAN STORAGE BASKET SET NATURAL','2 PC RATTAN STORAGE BASKET SET NATURAL','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0062','2 PCE HOOK STAINLESS STEEL MEDIUM','2 PCE HOOK STAINLESS STEEL MEDIUM','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0061','2 PCE HOOK STAINLESS STEEL SMALL','2 PCE HOOK STAINLESS STEEL SMALL','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TOT003','2 PLATE AUTO STOVE','2 PLATE AUTO STOVE','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CBD010','2 POLE DIN ISOLATOR 63A','2 POLE DIN ISOLATOR 63A','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('NUR63','2 POLE SAMITE ISOLATOR GREEN 63A','2 POLE SAMITE ISOLATOR GREEN 63A','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('H0013','2 TIER DISH RACK (CHROME) WITH DRIP TRAY','2 TIER DISH RACK (CHROME) WITH DRIP TRAY','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0006','2 TIER DISH RACK BLACK','2 TIER DISH RACK BLACK','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('KD0005','2 TIER DISH RACK WITH CUTLERY HOLDER','2 TIER DISH RACK WITH CUTLERY HOLDER','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('F6010','2.5 PAINT ROLLER EXT. POLE','2.5 PAINT ROLLER EXT. POLE','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ELE003','20MM 8 WAY LOOPING BOX','20MM 8 WAY LOOPING BOX','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ELE004','20MM BEND LONG','20MM BEND LONG','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CCR009','20MM CABLE CLIP R','20MM CABLE CLIP R','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS46','20MM CONDUIT COUPLING G12NEW','20MM CONDUIT COUPLING G12NEW','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS49','20MM CONDUIT ELBOW G10NEW','20MM CONDUIT ELBOW G10NEW','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS47','20MM CONDUIT MALE/FEMALE ADAPTER','20MM CONDUIT MALE/FEMALE ADAPTER','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS48','20MM LOOPING BOX + LID + SCREWS 8WAY','20MM LOOPING BOX + LID + SCREWS 8WAY','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ELE0213','20MM LOOPING BOX 1 WAY','20MM LOOPING BOX 1 WAY','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ELE0212','20MM LOOPING BOX LID ONLY','20MM LOOPING BOX LID ONLY','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ELE001','20MM PVC GLAND','20MM PVC GLAND','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ELE006','20MM PVC PUSH IN GLAND','20MM PVC PUSH IN GLAND','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ELE228','20MM PVC SOLID TEE','20MM PVC SOLID TEE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('7860537','20MM SADDLE PVC','20MM SADDLE PVC','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ELE002','20MM SADDLE STEEL','20MM SADDLE STEEL','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('7861806','20MM SADDLES KNOCK ON','20MM SADDLES KNOCK ON','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TUBH01','250ML HEX TUB','250ML HEX TUB','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CCR010','25MM CABLE CLIP 25MM','25MM CABLE CLIP 25MM','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS51','25MM CONDUIT COUPLING G13NEW','25MM CONDUIT COUPLING G13NEW','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS50','25MM CONDUIT ELBOW G11NEW','25MM CONDUIT ELBOW G11NEW','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS52','25MM CONDUIT MALE ADAPTER G15NEW','25MM CONDUIT MALE ADAPTER G15NEW','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ELE0090','25MM PVC SADDLE','25MM PVC SADDLE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('10050','26W 4 PIN LAMP G24Q3 STRAIGHT','26W 4 PIN LAMP G24Q3 STRAIGHT','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('SPC007','2FT 2X TW LED STRIP FFT SLIM MILK WHT','2FT 2X TW LED STRIP FFT SLIM MILK WHT','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('SPC005','2FT 2X7W LED STRIP FFT WHT','2FT 2X7W LED STRIP FFT WHT','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2LED','2FT LED 18W DAYLIGHT KIT','2FT LED 18W DAYLIGHT KIT','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HINGE006','2PC BUTT HINGE 40MM','2PC BUTT HINGE 40MM','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HINGE009','2PC BUTT HINGE BRASS 75MM','2PC BUTT HINGE BRASS 75MM','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HINGE007','2PC BUTT HINGES BRASS 50MM','2PC BUTT HINGES BRASS 50MM','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HINGE008','2PC BUTT HINGES BRASS 65MM','2PC BUTT HINGES BRASS 65MM','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PULL002','2PC PULLEY HOOK SILVER','2PC PULLEY HOOK SILVER','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('KD0002','3 DRAWER JEWELLERY ORGANIZER','3 DRAWER JEWELLERY ORGANIZER','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0048','3 HOOK COAT HOOK - CHROME','3 HOOK COAT HOOK - CHROME','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0046','3 HOOK WOODEN/BLACK COAT HOOK','3 HOOK WOODEN/BLACK COAT HOOK','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0045','3 HOOK WOODEN/GOLD COAT HOOK','3 HOOK WOODEN/GOLD COAT HOOK','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MUG005','3 PACK MULTI COLOR MUG SET','3 PACK MULTI COLOR MUG SET','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AFD4KL','3 PANEL ALU FULL DOOR LEFT/RIGHT','3 PANEL ALU FULL DOOR LEFT/RIGHT','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('UBTPB','3 PANEL STABLE DOOR ALUMINIUM L/R','3 PANEL STABLE DOOR ALUMINIUM L/R','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BASKET004','3 PC LAUNDRY STORAGE ROUND MAHOGANY','3 PC LAUNDRY STORAGE ROUND MAHOGANY','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BASKET002','3 PC LAUNDRY STORAGE ROUND NATURAL','3 PC LAUNDRY STORAGE ROUND NATURAL','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BASKET003','3 PC LAUNDRY STORAGE SQUARE GREY','3 PC LAUNDRY STORAGE SQUARE GREY','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BASKET001','3 PC LAUNDRY STORAGE SQUARE NATURAL','3 PC LAUNDRY STORAGE SQUARE NATURAL','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TROLLEY001','3 TIER KITCHEN TROLLEY BLACK XH-1','3 TIER KITCHEN TROLLEY BLACK XH-1','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MRP33','3 WAY MULTI PLUG','3 WAY MULTI PLUG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RWBC60300','3.00MM WOOD BRAD CARDED','3.00MM WOOD BRAD CARDED','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RPNSC3865','3/8 NUT SETTER','3/8 NUT SETTER','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RWFC63200','32.00MM WOOD FLAT CARDED','32.00MM WOOD FLAT CARDED','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PL32CHAIN','32MM BASIN PLUG+CHAIN BLACK','32MM BASIN PLUG+CHAIN BLACK','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RWFC63500','35.00MM WOOD FLAT CARDED','35.00MM WOOD FLAT CARDED','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FCS001','3PC FACE CLAMP SET - D021','3PC FACE CLAMP SET - D021','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BRAC0007','4 PACK - L BRACKETS 80X80','4 PACK - L BRACKETS 80X80','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BRAC0015','4 PACK ANGLE BRACKETS STAINLESS','4 PACK ANGLE BRACKETS STAINLESS','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BRAC0002','4 PACK CORNER BRACE 70X70','4 PACK CORNER BRACE 70X70','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BRAC0001','4 PACK CORNER BRACE BRONZE 100X100','4 PACK CORNER BRACE BRONZE 100X100','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BRAC0003','4 PACK L BRACKETS 20X20 YP','4 PACK L BRACKETS 20X20 YP','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BRAC0004','4 PACK L BRACKETS 35X35','4 PACK L BRACKETS 35X35','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BRAC0011','4 PACK L BRACKETS 55X55 - CT-5019','4 PACK L BRACKETS 55X55 - CT-5019','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BRAC0006','4 PACK L BRACKETS 55X55 - YP','4 PACK L BRACKETS 55X55 - YP','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BRAC0009','4 PACK L BRACKETS STAINLESS STEEL','4 PACK L BRACKETS STAINLESS STEEL','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BRAC0010','4 PACK L BRACKETS STAINLESS STEEL','4 PACK L BRACKETS STAINLESS STEEL','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CW053','4 PACK OFFICE CHAIR SWIVEL CASTORS 40MM','4 PACK OFFICE CHAIR SWIVEL CASTORS 40MM','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CW052','4 PACK OFFICE CHAIR SWIVEL CASTORS 50MM SQ','4 PACK OFFICE CHAIR SWIVEL CASTORS 50MM SQ','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CW050','4 PACK PP CASTORS 50MM','4 PACK PP CASTORS 50MM','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CW047','4 PACK PP SWIVEL CASTORS 30MM','4 PACK PP SWIVEL CASTORS 30MM','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CW048','4 PACK PP SWIVEL CASTORS 40MM','4 PACK PP SWIVEL CASTORS 40MM','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CW049','4 PACK SWIVEL CASTORS 40MM - CT','4 PACK SWIVEL CASTORS 40MM - CT','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CW051','4 PACK SWIVEL CASTORS 50MM SQ PLATE','4 PACK SWIVEL CASTORS 50MM SQ PLATE','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALUSTBLE','4 PANEL STABLE DOOR ALUMINIUM','4 PANEL STABLE DOOR ALUMINIUM','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BASKET006','4 PC LAUNDRY ORGANISER GREY & WHITE','4 PC LAUNDRY ORGANISER GREY & WHITE','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CLEAN035','4 SEASON DISPOSABLE GLOVES','4 SEASON DISPOSABLE GLOVES','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0012','4 TIER SHOE RACK','4 TIER SHOE RACK','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MRP34','4 WAY MULTI PLUG','4 WAY MULTI PLUG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RWBC60400','4.00MM WOOD BRAD CARDED','4.00MM WOOD BRAD CARDED','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PL40WCHAIN','40MM BATH PLUG+CHAIN WHITE','40MM BATH PLUG+CHAIN WHITE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('40S','40MM PIPE SV SABS 6M','40MM PIPE SV SABS 6M','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('4LED','4FT LED LIGHT 36W DAYLIGHT','4FT LED LIGHT 36W DAYLIGHT','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RWGC4X65','4MM GLASS BIT CARDED','4MM GLASS BIT CARDED','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BBC0001','4PC BREAD BIN & CANISTER SET BLACK','4PC BREAD BIN & CANISTER SET BLACK','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BBC0003','4PC BREAD BIN & CANISTER SET BLACK','4PC BREAD BIN & CANISTER SET BLACK','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BBC0004','4PC BREAD BIN & CANISTER SET CREAM','4PC BREAD BIN & CANISTER SET CREAM','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BBC0002','4PC BREAD BIN & CANISTER SET WHITE','4PC BREAD BIN & CANISTER SET WHITE','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HINGE011','4PC BUTT HINGE BRONZE 35MM','4PC BUTT HINGE BRONZE 35MM','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HAS12','4PC HOSE ACCESSORY SET 1/2','4PC HOSE ACCESSORY SET 1/2','Garden','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('WCS001','4PC WOOD CHISEL SET - D022','4PC WOOD CHISEL SET - D022','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('DWC4060','4X60 DRYWALL SCREW','4X60 DRYWALL SCREW','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TROLLEY002','5 BASKET KITCHEN TROLLEY BLACK XH-2','5 BASKET KITCHEN TROLLEY BLACK XH-2','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HOOK012','5 HOOK BAMBOO - BLACK','5 HOOK BAMBOO - BLACK','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0053','5 HOOK COAT RACK - BLACK','5 HOOK COAT RACK - BLACK','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0052','5 HOOK COAT RACK - CHROME','5 HOOK COAT RACK - CHROME','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0054','5 HOOK COAT RACK FANCY - CHROME','5 HOOK COAT RACK FANCY - CHROME','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HOOK013','5 HOOKS BLACK/BAMBOO','5 HOOKS BLACK/BAMBOO','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HOOK011','5 HOOKS CHROME','5 HOOKS CHROME','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU1K','5 PANEL ALU FULL DOOR BRONZE','5 PANEL ALU FULL DOOR BRONZE','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU2K','5 PANEL STABLE DOOR BRONZE','5 PANEL STABLE DOOR BRONZE','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0058','5 RACK HAT & COAT HOOK - BLACK','5 RACK HAT & COAT HOOK - BLACK','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RWBC60500','5.00MM WOOD BRAD CARDED','5.00MM WOOD BRAD CARDED','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RPNSC51665','5/16 NUT SETTER','5/16 NUT SETTER','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TUBH003','500ML HEX TUB','500ML HEX TUB','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('SSN50','50MM COUPLING SSN 50MM STEEL','50MM COUPLING SSN 50MM STEEL','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('400612','50MM END CAP','50MM END CAP','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLD17','50MM FEMALE ADAPTOR 50X40MM','50MM FEMALE ADAPTOR 50X40MM','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUWT51','50MM IE TEE','50MM IE TEE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLD16','50MM MALE ADAPTOR 50X40MM','50MM MALE ADAPTOR 50X40MM','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('50N','50MM PIPE SV NON/SABS 6M','50MM PIPE SV NON/SABS 6M','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('50S','50MM PIPE SV SABS 6M','50MM PIPE SV SABS 6M','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('400600','50MM PVC COUPLING','50MM PVC COUPLING','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('400603','50MM PVC ELBOW 45 DEG','50MM PVC ELBOW 45 DEG','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('400606','50MM PVC ELBOW 45 DEG IE','50MM PVC ELBOW 45 DEG IE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('400602','50MM PVC ELBOW 90 DEG','50MM PVC ELBOW 90 DEG','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('400605','50MM PVC ELBOW 90 DEG IE','50MM PVC ELBOW 90 DEG IE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('400608','50MM PVC FEMALE ADAPTER','50MM PVC FEMALE ADAPTER','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('400607','50MM PVC MALE ADAPTER','50MM PVC MALE ADAPTER','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('400609','50MM PVC REDUCER 50X40MM','50MM PVC REDUCER 50X40MM','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('400601','50MM PVC TEE','50MM PVC TEE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('400604','50MM PVC VENT','50MM PVC VENT','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUVC50','50MM PVC VENT COWL','50MM PVC VENT COWL','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('400610','50MM PVC Y JUNCTION','50MM PVC Y JUNCTION','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('400611','50MM PVC Y JUNCTION IE','50MM PVC Y JUNCTION IE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLUWAB5','50MM STRAP ON BOSS','50MM STRAP ON BOSS','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TTD-NYLN05-5','5MM NYLOCK NUT (5)','5MM NYLOCK NUT (5)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('GJS0002','5PC GLASS JUG SET - SFSJ/LS - B004','5PC GLASS JUG SET - SFSJ/LS - B004','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('GJS0001','5PC GLASS JUG SET - PAGA - SHST/LS - B002','5PC GLASS JUG SET - PAGA - SHST/LS - B002','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5035-50','5X35 NAIL IN ANCHOR (50)','5X35 NAIL IN ANCHOR (50)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5035-10','5X35 NAIL IN ANCHOR (10)','5X35 NAIL IN ANCHOR (10)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5035-15','5X35 NAIL IN ANCHOR (15)','5X35 NAIL IN ANCHOR (15)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5035-5','5X35 NAIL IN ANCHOR (5)','5X35 NAIL IN ANCHOR (5)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5050-100','5X50 NAIL IN ANCHOR (100)','5X50 NAIL IN ANCHOR (100)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5050-15','5X50 NAIL IN ANCHOR (15)','5X50 NAIL IN ANCHOR (15)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5050-5','5X50 NAIL IN ANCHOR (5)','5X50 NAIL IN ANCHOR (5)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5050-50','5X50 NAIL IN ANCHOR (50)','5X50 NAIL IN ANCHOR (50)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA5050-10','5X50 NAIL IN ANCHORS (10)','5X50 NAIL IN ANCHORS (10)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MUG004','6 PACK MUG SET','6 PACK MUG SET','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MUG001','6 PACK WHITE CERAMIC MUG','6 PACK WHITE CERAMIC MUG','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MUG002','6 PACK WHITE CERAMIC MUG SET','6 PACK WHITE CERAMIC MUG SET','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MUG003','6 PACK WHITE CERAMIC MUG SET','6 PACK WHITE CERAMIC MUG SET','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('HA0022','6 PCE CANDY COLOR CLOTHES HANGERS','6 PCE CANDY COLOR CLOTHES HANGERS','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RUW06.0X150X210','6.0MMX150X210 SDS-PLUS','6.0MMX150X210 SDS-PLUS','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('60A EARTH LEAKAGE','60A EARTH LEAKAGE','60A EARTH LEAKAGE','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('LEDT','60W T-BULB E27','60W T-BULB E27','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('63A EARTH LEAKAGE','63A EARTH LEAKAGE','63A EARTH LEAKAGE','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('EVA619','6X19 BONDED WASHER','6X19 BONDED WASHER','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6035-15','6X35 NAIL IN ANCHOR (15)','6X35 NAIL IN ANCHOR (15)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6035-50','6X35 NAIL IN ANCHOR (50)','6X35 NAIL IN ANCHOR (50)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6035-10','6X35 NAIL IN ANCHORS (10)','6X35 NAIL IN ANCHORS (10)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6045-100','6X45 NAIL IN ANCHOR (100)','6X45 NAIL IN ANCHOR (100)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6045-15','6X45 NAIL IN ANCHOR (15)','6X45 NAIL IN ANCHOR (15)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6045-50','6X45 NAIL IN ANCHOR (50)','6X45 NAIL IN ANCHOR (50)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6055-15','6X55 NAIL IN ANCHOR (15)','6X55 NAIL IN ANCHOR (15)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6055-10','6X55 NAIL IN ANCHOR (10)','6X55 NAIL IN ANCHOR (10)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6055-5','6X55 NAIL IN ANCHOR (5)','6X55 NAIL IN ANCHOR (5)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6055-50','6X55 NAIL IN ANCHOR (50)','6X55 NAIL IN ANCHOR (50)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6060-100','6X60 NAIL IN ANCHOR (100)','6X60 NAIL IN ANCHOR (100)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6060-50','6X60 NAIL IN ANCHOR (50)','6X60 NAIL IN ANCHOR (50)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6070-10','6X70 NAIL IN ANCHOR (10)','6X70 NAIL IN ANCHOR (10)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6070-100','6X70 NAIL IN ANCHOR (100)','6X70 NAIL IN ANCHOR (100)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6070-15','6X70 NAIL IN ANCHOR (15)','6X70 NAIL IN ANCHOR (15)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA6070-50','6X70 NAIL IN ANCHOR (50)','6X70 NAIL IN ANCHOR (50)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('B03890','748MM BLACK SLIM LINE SHOWER CHANNEL','748MM BLACK SLIM LINE SHOWER CHANNEL','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('75 SV','75 X PIPE SV SABS 6M','75 X PIPE SV SABS 6M','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TUBH004','750ML HEX TUB','750ML HEX TUB','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('SCDS007','7PC VDE SCREWDRIVER SET - D025','7PC VDE SCREWDRIVER SET - D025','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('7WA60B22','7W LED A60 B22','7W LED A60 B22','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('7WA60E27','7W LED A60 E27','7W LED A60 E27','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('7WSTICKB22','7W LED STICK B22','7W LED STICK B22','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('7WSTICKE27','7W LED STICK E27','7W LED STICK E27','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RWBC60800','8.00MM WOOD BRAD CARDED','8.00MM WOOD BRAD CARDED','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RUW08X150X210','8.0MMX150X210 SDS-PLUS','8.0MMX150X210 SDS-PLUS','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('80A EARTH LEAKAGE','80A EARTH LEAKAGE','80A EARTH LEAKAGE','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('THER001','80X83 THERMAL PRINTER ROLL','80X83 THERMAL PRINTER ROLL','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CCR001','8MM CABLE CLIP RND','8MM CABLE CLIP RND','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CCF004','8MM CABLE CLIP FLT','8MM CABLE CLIP FLT','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA8060-100','8X60 NAIL IN ANCHOR (100)','8X60 NAIL IN ANCHOR (100)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA8060-50','8X60 NAIL IN ANCHOR (50)','8X60 NAIL IN ANCHOR (50)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('TF-NA8080-50','8X80 NAIL IN ANCHOR (50)','8X80 NAIL IN ANCHOR (50)','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RBRC50900','9.0MM STANDARD BRICK DRILL BIT','9.0MM STANDARD BRICK DRILL BIT','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CSP001','9PC COMBINATION SPANNER SET (8MM-22MM)','9PC COMBINATION SPANNER SET (8MM-22MM)','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('9WSTICKB22','9W LED STICK B22','9W LED STICK B22','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('9WSTICKE27','9W LED STICK E27','9W LED STICK E27','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ABPG0000','ABRASIVE BRITE PAD GREEN 150X230MM','ABRASIVE BRITE PAD GREEN 150X230MM','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ACET002','ACETONE 1L','ACETONE 1L','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ACET001','ACETONE 5L','ACETONE 5L','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BV22','AD BALL VALVE 22MM CONNEX','AD BALL VALVE 22MM CONNEX','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('7860331','ADAPTOR 3X2PIN #','ADAPTOR 3X2PIN #','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('R21','ADAPTOR 2X2PIN 3PIN USB','ADAPTOR 2X2PIN 3PIN USB','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ADA201','ADAPTOR B X C','ADAPTOR B X C','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ADA202','ADAPTOR B X H','ADAPTOR B X H','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ADA103','ADAPTOR C X B','ADAPTOR C X B','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ADA105','ADAPTOR C X H BRASS','ADAPTOR C X H BRASS','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ADA106','ADAPTOR C X H CHROME','ADAPTOR C X H CHROME','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('7860542','ADAPTOR EURO SINGLE TOP/BOT ENTRY','ADAPTOR EURO SINGLE TOP/BOT ENTRY','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('415-52403 SP','ADAPTOR FOR BRASS ARM 6MM TO 8MM SP','ADAPTOR FOR BRASS ARM 6MM TO 8MM SP','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('7862659','ADAPTOR PIN 2X3 R19','ADAPTOR PIN 2X3 R19','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('R17','ADAPTOR REDISSON R17','ADAPTOR REDISSON R17','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('R18','ADAPTOR SCHUKO 2X2PIN','ADAPTOR SCHUKO 2X2PIN','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('R90','ADAPTOR SHUKO EURO TRIPLE','ADAPTOR SHUKO EURO TRIPLE','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AP02','ADAPTOR SINGLE PLUG & 2 TWIN PLUG','ADAPTOR SINGLE PLUG & 2 TWIN PLUG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ADSG0025','ADHESIVE SHOE GLUE 25ML G/DEVIL','ADHESIVE SHOE GLUE 25ML G/DEVIL','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AWR15','ADJUSTABLE WRENCH 150MM RUBBER GRIP','ADJUSTABLE WRENCH 150MM RUBBER GRIP','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AWR20','ADJUSTABLE WRENCH 200MM RUBBER GRIP','ADJUSTABLE WRENCH 200MM RUBBER GRIP','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AWR25','ADJUSTABLE WRENCH 250MM RUBBER GRIP','ADJUSTABLE WRENCH 250MM RUBBER GRIP','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AWD002C','ADJUSTABLE WRENCH DIY 250MM','ADJUSTABLE WRENCH DIY 250MM','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AWD003','ADJUSTABLE WRENCH DIY 300MM','ADJUSTABLE WRENCH DIY 300MM','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLAH','AERIS HANDLE ONLY','AERIS HANDLE ONLY','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('0661','AERIS SINK MIXER WALL TYPE','AERIS SINK MIXER WALL TYPE','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AEROLITE','AEROLITE 10000X1200X50MM','AEROLITE 10000X1200X50MM','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AEROLITE 11316','AEROLITE 5000X1200X135MM','AEROLITE 5000X1200X135MM','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AEROLITE 21115','AEROLITE 6000X1200X100MM','AEROLITE 6000X1200X100MM','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ABGUN001','AIR BLOW GUN','AIR BLOW GUN','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('100102','AIR BRICK CONCRETE','AIR BRICK CONCRETE','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AIR003','AIR BRICK PLASTIC INSIDE','AIR BRICK PLASTIC INSIDE','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AIR002','AIR BRICK PLASTIC OUTSIDE','AIR BRICK PLASTIC OUTSIDE','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ABG031','AIR DUSTER 1.6MM NOZZLE','AIR DUSTER 1.6MM NOZZLE','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FRY002','AIR FRYER LINER ROUND','AIR FRYER LINER ROUND','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FRY003','AIR FRYER LINER ROUND 16CM 50 PIECES - A-6','AIR FRYER LINER ROUND 16CM 50 PIECES - A-6','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FRY001','AIR FRYER LINER SQUARE','AIR FRYER LINER SQUARE','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('SKIT001','AIR SPRAYER CONNECTOR KIT 4PC','AIR SPRAYER CONNECTOR KIT 4PC','Garden','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AKLA','AK LIGHTNING ARRESTER 2 POLE','AK LIGHTNING ARRESTER 2 POLE','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('413-52902','ALIMINIUM FLOAT ARM 165MM','ALIMINIUM FLOAT ARM 165MM','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('413-52903','ALIMINIUM FLOAT ARM 190MM','ALIMINIUM FLOAT ARM 190MM','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('APEW5L','ALL PURPOSE E/SHELL WHITE 5L','ALL PURPOSE E/SHELL WHITE 5L','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('APMW20LTR','ALL PURPOSE MATT WHITE 20LTR','ALL PURPOSE MATT WHITE 20LTR','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2224','ALL WEATHER BUSH SAND 20LT','ALL WEATHER BUSH SAND 20LT','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2250','ALL WEATHER BUSH SAND 5L','ALL WEATHER BUSH SAND 5L','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2225','ALL WEATHER NATURAL CERAMIC 20LT','ALL WEATHER NATURAL CERAMIC 20LT','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2251','ALL WEATHER NATURAL CERAMIC 5L','ALL WEATHER NATURAL CERAMIC 5L','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2223','ALL WEATHER ORGANIC BEIGE 20LT','ALL WEATHER ORGANIC BEIGE 20LT','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2238','ALL WEATHER ORGANIC BEIGE 5L','ALL WEATHER ORGANIC BEIGE 5L','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2228','ALL WEATHER PLASTER SAND 20LT','ALL WEATHER PLASTER SAND 20LT','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2300','ALL WEATHER PLASTER SAND 5L','ALL WEATHER PLASTER SAND 5L','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2227','ALL WEATHER SEA MIST 20LT','ALL WEATHER SEA MIST 20LT','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2292','ALL WEATHER SEA MIST 5L','ALL WEATHER SEA MIST 5L','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2222','ALL WEATHER SPANISH SUNSET 20LT','ALL WEATHER SPANISH SUNSET 20LT','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2237','ALL WEATHER SPANISH SUNSET 5L','ALL WEATHER SPANISH SUNSET 5L','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2226','ALL WEATHER STORM GREY 20LT','ALL WEATHER STORM GREY 20LT','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2291','ALL WEATHER STORM GREY 5L','ALL WEATHER STORM GREY 5L','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2220','ALL WEATHER TORNADO 20LT','ALL WEATHER TORNADO 20LT','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2234','ALL WEATHER TORNADO 5L','ALL WEATHER TORNADO 5L','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2229','ALL WEATHER WEATHERED GOLD 20LT','ALL WEATHER WEATHERED GOLD 20LT','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2310','ALL WEATHER WEATHERED GOLD 5L','ALL WEATHER WEATHERED GOLD 5L','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2230','ALL WEATHER WHITE 20LT','ALL WEATHER WHITE 20LT','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('2311','ALL WEATHER WHITE 5L','ALL WEATHER WHITE 5L','Paints & Allied','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AKEY003','ALLEN KEY SET 9PCS M','ALLEN KEY SET 9PCS M','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CON0196','ALLEN KEY 9 PCS SHORT ARM BALL POINT HEX KEY SET','ALLEN KEY 9 PCS SHORT ARM BALL POINT HEX KEY SET','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CON0194','ALLEN KEY 9 PCS SHORT ARM HEX KEY SET','ALLEN KEY 9 PCS SHORT ARM HEX KEY SET','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('CON0195','ALLEN KEY 9 PCS SHORT ARM TORX KEY SET','ALLEN KEY 9 PCS SHORT ARM TORX KEY SET','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AKEY001','ALLEN KEY FLAT HEAD LONG 9PCS','ALLEN KEY FLAT HEAD LONG 9PCS','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('10105','ALLEN KEY SET 8 PC MINI','ALLEN KEY SET 8 PC MINI','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU002','ALU FANCY FULL DOOR (BEAUTY)','ALU FANCY FULL DOOR (BEAUTY)','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU003','ALU FANCY FULL DOOR (FLAG)','ALU FANCY FULL DOOR (FLAG)','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU001','ALU FANCY FULL DOOR (NTOMBI)','ALU FANCY FULL DOOR (NTOMBI)','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU004','ALU FANCY FULL DOOR (OLIVIA)','ALU FANCY FULL DOOR (OLIVIA)','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU011','ALU FANCY PIVOT DOOR (AB10)','ALU FANCY PIVOT DOOR (AB10)','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU012','ALU FANCY PIVOT DOOR (SHIELD) BRZ','ALU FANCY PIVOT DOOR (SHIELD) BRZ','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU010','ALU FANCY PIVOT DOOR (STAG)','ALU FANCY PIVOT DOOR (STAG)','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU009','ALU FANCY PIVOT DOOR (ZIGZAG)','ALU FANCY PIVOT DOOR (ZIGZAG)','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU006','ALU FANCY STABLE DOOR (BEAUTY)','ALU FANCY STABLE DOOR (BEAUTY)','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU007','ALU FANCY STABLE DOOR (FLAG)','ALU FANCY STABLE DOOR (FLAG)','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU005','ALU FANCY STABLE DOOR (NTOMBI)','ALU FANCY STABLE DOOR (NTOMBI)','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU008','ALU FANCY STABLE DOOR (OLIVIA)','ALU FANCY STABLE DOOR (OLIVIA)','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FBAND003','ALU FLASH 100MMX2.5M','ALU FLASH 100MMX2.5M','Roofing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FBAND006','ALU FLASH 100MMX5.0M','ALU FLASH 100MMX5.0M','Roofing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FBAND001','ALU FLASH 50MMX2.5M','ALU FLASH 50MMX2.5M','Roofing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FBAND004','ALU FLASH 50MMX5.0M','ALU FLASH 50MMX5.0M','Roofing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FBAND002','ALU FLASH 75MMX2.5M','ALU FLASH 75MMX2.5M','Roofing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FBAND005','ALU FLASH 75MMX5.0M','ALU FLASH 75MMX5.0M','Roofing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FBAND007','ALU FLASH A GRADE 100MMX10M','ALU FLASH A GRADE 100MMX10M','Roofing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FBAND008','ALU FLASH A GRADE 50MMX10M','ALU FLASH A GRADE 50MMX10M','Roofing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FBAND009','ALU FLASH A GRADE 75MMX10M','ALU FLASH A GRADE 75MMX10M','Roofing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU4PR','ALU FULL DOOR 4 PANEL RIGHT','ALU FULL DOOR 4 PANEL RIGHT','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALUAD66','ALU FULL ECONO DOOR AD66 R19','ALU FULL ECONO DOOR AD66 R19','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('OVALR01','ALU RAIL OVAL CUPBOARD 20MM PER METER','ALU RAIL OVAL CUPBOARD 20MM PER METER','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ASG1000','ALU SECURITY GATE 1000X2000','ALU SECURITY GATE 1000X2000','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ASD','ALU SLIDING DOOR LOCKSET','ALU SLIDING DOOR LOCKSET','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ASDW','ALU SLIDING DOOR WHEEL ONLY','ALU SLIDING DOOR WHEEL ONLY','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('B1660','ALUM BLIND 1600 X 1600MM','ALUM BLIND 1600 X 1600MM','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('413-52924SP','ALUMINIUM FLOAT ARM 220MM','ALUMINIUM FLOAT ARM 220MM','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FOIL002','ALUMINIUM FOIL HEAVY DUTY - 30CM X 5M','ALUMINIUM FOIL HEAVY DUTY - 30CM X 5M','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FOIL003','ALUMINIUM FOIL HEAVY DUTY - 30CM X 10M','ALUMINIUM FOIL HEAVY DUTY - 30CM X 10M','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FOIL005','ALUMINIUM FOIL HEAVY DUTY - 45CM X 10M','ALUMINIUM FOIL HEAVY DUTY - 45CM X 10M','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('FOIL004','ALUMINIUM FOIL HEAVY DUTY - 45CM X 5M','ALUMINIUM FOIL HEAVY DUTY - 45CM X 5M','Homeware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('A1','ALUMINUM BRACKET 2PC','ALUMINUM BRACKET 2PC','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ALU05','ALUMINUM WINDOW STAY PAIR','ALUMINUM WINDOW STAY PAIR','Doors & Frames','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('BRAC0014','ANGLE BRACKETS 25X25','ANGLE BRACKETS 25X25','Fasteners & Ironmongery','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AGS001','ANGLE GRINDER SPANNER 10-46MM','ANGLE GRINDER SPANNER 10-46MM','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('RAGW10-30','ANGLE GRINDER SPANNER ADJUSTABLE','ANGLE GRINDER SPANNER ADJUSTABLE','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AI001','ANGLE IRON 25X25X2MM X 6M','ANGLE IRON 25X25X2MM X 6M','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AI002','ANGLE IRON 25X25X3MM X 6M','ANGLE IRON 25X25X3MM X 6M','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AI003','ANGLE IRON 30X30X2MM X 6M','ANGLE IRON 30X30X2MM X 6M','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AI004','ANGLE IRON 30X30X3MM X 6M','ANGLE IRON 30X30X3MM X 6M','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AI005','ANGLE IRON 40X40X2MM X 6M','ANGLE IRON 40X40X2MM X 6M','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AI006','ANGLE IRON 40X40X3MM X 6M','ANGLE IRON 40X40X3MM X 6M','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AI007','ANGLE IRON 50X50X5MM X 6M','ANGLE IRON 50X50X5MM X 6M','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AS001','ANGLE SQUARE -300MM- D020','ANGLE SQUARE -300MM- D020','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLU601','ANGLE VALVE 15MM H/DUTY','ANGLE VALVE 15MM H/DUTY','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLU501','ANGLE VALVE CP 15MM','ANGLE VALVE CP 15MM','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('PLU502','ANGLE VALVE CP WASHING MACHINE 15X3/4','ANGLE VALVE CP WASHING MACHINE 15X3/4','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AVSQ15/15','ANGLE VALVE SQUARE HANDLE 15MMX15MM','ANGLE VALVE SQUARE HANDLE 15MMX15MM','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AST001','ANTI SLIP TAPE BLACK 25MM X 5M','ANTI SLIP TAPE BLACK 25MM X 5M','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AST005','ANTI SLIP TAPE BLACK 50MM X 5M','ANTI SLIP TAPE BLACK 50MM X 5M','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('LAD015','ANTI SLIP TAPE BLACK 600MMX150MM','ANTI SLIP TAPE BLACK 600MMX150MM','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AST002','ANTI SLIP TAPE CLEAR 20MM X 250MM','ANTI SLIP TAPE CLEAR 20MM X 250MM','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AST003','ANTI SLIP TAPE CLEAR 20MM X 380MM','ANTI SLIP TAPE CLEAR 20MM X 380MM','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AST004','ANTI SLIP TAPE WHITE 20MM X 380MM','ANTI SLIP TAPE WHITE 20MM X 380MM','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('H362','AP AUTO FUSES 10PC','AP AUTO FUSES 10PC','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AR001','APPLIANCE ROLLER - BW0520-15','APPLIANCE ROLLER - BW0520-15','General Hardware','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ARBOR001','ARBOR HOLE SAW 3/8 INCH','ARBOR HOLE SAW 3/8 INCH','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ARBOR002','ARBOR HOLE SAW 7/16 INCH','ARBOR HOLE SAW 7/16 INCH','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ASB 1200X3000 4MM','ASBESTOS NUTEC BOARD 1200X3000 4MM','ASBESTOS NUTEC BOARD 1200X3000 4MM','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('ASB 1200X3600 4MM','ASBESTOS NUTEC BOARD 1200X3600 4MM','ASBESTOS NUTEC BOARD 1200X3600 4MM','Building Materials','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('413-57101SP','ASSY CISTERN STOPPER WHITE S/PACK','ASSY CISTERN STOPPER WHITE S/PACK','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('413-53301SP','ASSY CP HANDLE SKIN','ASSY CP HANDLE SKIN','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('413-52501','ASSY EASI CLEAN 145MM S/I','ASSY EASI CLEAN 145MM S/I','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('413-53291 SP','ASSY ECHO BUTTON + PUSH ROD SKIN PACKED','ASSY ECHO BUTTON + PUSH ROD SKIN PACKED','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('413-51114','ASSY HI FLO LL VALVE MK3 FRONT FLUSH','ASSY HI FLO LL VALVE MK3 FRONT FLUSH','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('413-53801','ASSY LEVER ARM UNIVERSAL S/PACKED','ASSY LEVER ARM UNIVERSAL S/PACKED','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('413-51113SP','ASSY MK-3 CC FRONT LIFT SKIN PACKED','ASSY MK-3 CC FRONT LIFT SKIN PACKED','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('413-51113','ASSY MK3 CC FRONT LIFT SKIN','ASSY MK3 CC FRONT LIFT SKIN','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('413-52401','ASSY TOPAZ SIDE INLET VALVE SP','ASSY TOPAZ SIDE INLET VALVE SP','Plumbing','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS63','AUS LUX SIL/GREY 4X4 ISOLATOR 60A','AUS LUX SIL/GREY 4X4 ISOLATOR 60A','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS29','AUS DB SURF 10-13WAY AUSPDBHD10W','AUS DB SURF 10-13WAY AUSPDBHD10W','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS28','AUS DB SURF 6-9WAY AUSPDBHD6W','AUS DB SURF 6-9WAY AUSPDBHD6W','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS21','AUS IND DBL/SOC AUSA-MD01','AUS IND DBL/SOC AUSA-MD01','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS18','AUS IND 1 LEVER AUSA-M101','AUS IND 1 LEVER AUSA-M101','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS19','AUS IND 2 LEVER AUSA-M102','AUS IND 2 LEVER AUSA-M102','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS20','AUS IND SGL/SOC AUSA-MS01','AUS IND SGL/SOC AUSA-MS01','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS30','AUS LUX 1L S/GREY AUSA101-B-SG','AUS LUX 1L S/GREY AUSA101-B-SG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS31','AUS LUX 2L S/GREY AUSA102-B-SG','AUS LUX 2L S/GREY AUSA102-B-SG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS58','AUS LUX 3L S/GREY AUSA103-B-SG','AUS LUX 3L S/GREY AUSA103-B-SG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS59','AUS LUX 4L S/GREY AUSA104-B-SG','AUS LUX 4L S/GREY AUSA104-B-SG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS60','AUS LUX 4X4 SOC + USB','AUS LUX 4X4 SOC + USB','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS32','AUS LUX D/SOC S/GREY AUSD01-B-SG','AUS LUX D/SOC S/GREY AUSD01-B-SG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS62','AUS LUX ISO 30A 4X2 S/GREY AUS MH-7-B-SG','AUS LUX ISO 30A 4X2 S/GREY AUS MH-7-B-SG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS61','AUS LUX S/SOC S/GREY 4X2 AUSM-08-B-SG','AUS LUX S/SOC S/GREY 4X2 AUSM-08-B-SG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS33','AUS LUX S/SOC S/GREY AUSS001-B-SG','AUS LUX S/SOC S/GREY AUSS001-B-SG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS27','AUS M/PLUG 11WAY 5 SWITCH AUSP-11B','AUS M/PLUG 11WAY 5 SWITCH AUSP-11B','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS26','AUS M/PLUG 11WAY AUSP-11','AUS M/PLUG 11WAY AUSP-11','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS23','AUS M/PLUG 7WAY 3 SWITCH AUSP-07B','AUS M/PLUG 7WAY 3 SWITCH AUSP-07B','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS22','AUS M/PLUG 7WAY AUSP-07','AUS M/PLUG 7WAY AUSP-07','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS25','AUS M/PLUG 9WAY 4 SWITCH AUSP-09B','AUS M/PLUG 9WAY 4 SWITCH AUSP-09B','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS24','AUS M/PLUG 9WAY AUSP-09','AUS M/PLUG 9WAY AUSP-09','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS10','AUS SINGLE SOCK 4X4 (16A) AUSM-08(S001)','AUS SINGLE SOCK 4X4 (16A) AUSM-08(S001)','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS2','AUS WHITE 1/L 2WAY SWITCH AUSA101-D','AUS WHITE 1/L 2WAY SWITCH AUSA101-D','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS1','AUS WHITE 1 LEVER SWITCH AUSA101','AUS WHITE 1 LEVER SWITCH AUSA101','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS11','AUS WHITE ISOLATOR 4X4 (60A) AUSM-07','AUS WHITE ISOLATOR 4X4 (60A) AUSM-07','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS3','AUS WHT 2L SWITCH AUSA102','AUS WHT 2L SWITCH AUSA102','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS LPFL-200XT01','AUSMA 200W LED FLOODLIGHT IP66 6500K','AUSMA 200W LED FLOODLIGHT IP66 6500K','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS35','AUSMA ADAPTER (1X16A,2X5A) AUSR-09','AUSMA ADAPTER (1X16A,2X5A) AUSR-09','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS45','AUSMA ADAPTER (3X5A) AUSR-24','AUSMA ADAPTER (3X5A) AUSR-24','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS36','AUSMA ADAPTER 3 X 2PIN + SNGL PLUG','AUSMA ADAPTER 3 X 2PIN + SNGL PLUG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS42','AUSMA ADAPTER 3PIN + 2PIN + SCHUKO','AUSMA ADAPTER 3PIN + 2PIN + SCHUKO','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS40','AUSMA ADAPTER DOUBLE PLUG','AUSMA ADAPTER DOUBLE PLUG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS37','AUSMA ADAPTER SCHUKO (1X5A) AUSR-16A','AUSMA ADAPTER SCHUKO (1X5A) AUSR-16A','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS39','AUSMA ADAPTER SCHUKO (1X5A,1X5A)','AUSMA ADAPTER SCHUKO (1X5A,1X5A)','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS44','AUSMA ADAPTER SURGE (1X16A,1X16A)','AUSMA ADAPTER SURGE (1X16A,1X16A)','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS38','AUSMA ADAPTER TOP ENTRY (1X5A) AUSR-17A','AUSMA ADAPTER TOP ENTRY (1X5A) AUSR-17A','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS41','AUSMA ADAPTER TRIPPLE PLUG','AUSMA ADAPTER TRIPPLE PLUG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS8','AUSMA DBL SOCK + 2PIN 4X4','AUSMA DBL SOCK + 2PIN 4X4','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS12','AUSMA ISOLATOR 4X4 (60A) W/LIGHT','AUSMA ISOLATOR 4X4 (60A) W/LIGHT','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS55','AUSMA JANUS COUPLER PLASTIC','AUSMA JANUS COUPLER PLASTIC','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS56','AUSMA JANUS COUPLER RUBBER','AUSMA JANUS COUPLER RUBBER','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MS11','AUSMA MET SILVER 1L 2WAY SWITCH','AUSMA MET SILVER 1L 2WAY SWITCH','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MS1','AUSMA MET SILVER 1 LEVER','AUSMA MET SILVER 1 LEVER','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MS2','AUSMA MET SILVER 2 LEVER','AUSMA MET SILVER 2 LEVER','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MS3','AUSMA MET SILVER 3 LEVER','AUSMA MET SILVER 3 LEVER','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MS7','AUSMA MET SILVER 3+2PIN','AUSMA MET SILVER 3+2PIN','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MS9','AUSMA MET SILVER 4 LEVER A-M04S-S','AUSMA MET SILVER 4 LEVER A-M04S-S','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MS6','AUSMA MET SILVER 4X2 SGL PLUG','AUSMA MET SILVER 4X2 SGL PLUG','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MS10','AUSMA MET SILVER 4X4 SINGLE PLUG + 2 USB','AUSMA MET SILVER 4X4 SINGLE PLUG + 2 USB','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS A-MD029(S)-S','AUSMA MET SILVER DBL PLUG 4X4','AUSMA MET SILVER DBL PLUG 4X4','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MS8','AUSMA MET SILVER ISOLATOR 4X2','AUSMA MET SILVER ISOLATOR 4X2','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MS4','AUSMA MET SILVER ISOLATOR 4X4','AUSMA MET SILVER ISOLATOR 4X4','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS A-MS02(S)-S','AUSMA MET SILVER SINGLE SOCKET 4X4','AUSMA MET SILVER SINGLE SOCKET 4X4','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS57','AUSMA PLUG TOP RUBBER 16A AUS M-10C','AUSMA PLUG TOP RUBBER 16A AUS M-10C','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS34','AUSMA PLUG TOP SURGE AUSM-10S','AUSMA PLUG TOP SURGE AUSM-10S','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS15','AUSMA S/M DBL SOCK 4X2 (16A,13A)','AUSMA S/M DBL SOCK 4X2 (16A,13A)','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MS01','AUSMA SILVER BLANK COVER 4X2','AUSMA SILVER BLANK COVER 4X2','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('MS02','AUSMA SILVER BLANK COVER 4X4','AUSMA SILVER BLANK COVER 4X4','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS43','AUSMA SURGE ADAPTOR 3PIN + 2PIN + SCHUKO','AUSMA SURGE ADAPTOR 3PIN + 2PIN + SCHUKO','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS4','AUSMA WHITE 3 LEVER SWITCH AUSA103','AUSMA WHITE 3 LEVER SWITCH AUSA103','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS5','AUSMA WHITE 4 LEVER SWITCH AUSA104','AUSMA WHITE 4 LEVER SWITCH AUSA104','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS6','AUSMA WHITE 6 LEVER SWITCH AUSA106','AUSMA WHITE 6 LEVER SWITCH AUSA106','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS17','AUSMA WHITE BLANK COVER 4X2','AUSMA WHITE BLANK COVER 4X2','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS16','AUSMA WHITE BLANK COVER 4X4 AUSA100','AUSMA WHITE BLANK COVER 4X4 AUSA100','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS9','AUSMA WHITE DBL SOCK 4X2 16A+5A','AUSMA WHITE DBL SOCK 4X2 16A+5A','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS7','AUSMA WHITE DBL SOCKET 4X4','AUSMA WHITE DBL SOCKET 4X4','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS13','AUSMA WHITE ISOLATOR 4X2 (30A) AUSM-H7','AUSMA WHITE ISOLATOR 4X2 (30A) AUSM-H7','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('AUS14','AUSMA WHITE SINGLE SCK 4X2 AUSM-08','AUSMA WHITE SINGLE SCK 4X2 AUSM-08','Electrical & Lighting','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
INSERT OR IGNORE INTO catalogue_products (code,name,description,category,image_name,image_type,image_size,image_key,active,created_by,created_at,updated_by,updated_at) VALUES ('5029','AVIATION TIN SNIP 250MM STRAIGHT','AVIATION TIN SNIP 250MM STRAIGHT','Tools','','',0,'',1,'system:2026-10-10-instore-batch-2',datetime('now'),'system:2026-10-10-instore-batch-2',datetime('now'));
--> statement-breakpoint
