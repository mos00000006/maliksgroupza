-- Assorted paint display is handled entirely in the application UI/PDF.
-- This migration intentionally performs no schema-dependent update so it remains
-- safe on databases where legacy code_5l/code_20l columns do not exist.
SELECT 1;
