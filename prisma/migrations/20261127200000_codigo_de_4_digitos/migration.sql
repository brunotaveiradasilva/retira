-- Código de 4 dígitos para materiais e colaboradores.
-- A coluna nasce vazia, os cadastros que já existem recebem 1, 2, 3... por empresa
-- (na ordem em que foram criados) e só então ela vira obrigatória e única.

-- materiais
ALTER TABLE "materiais" ADD COLUMN "numero" INTEGER;

UPDATE "materiais" AS m
SET "numero" = ordem.n
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "empresa_id" ORDER BY "criado_em", "id") AS n
  FROM "materiais"
) AS ordem
WHERE m."id" = ordem."id";

ALTER TABLE "materiais" ALTER COLUMN "numero" SET NOT NULL;

CREATE UNIQUE INDEX "materiais_empresa_id_numero_key" ON "materiais"("empresa_id", "numero");

-- colaboradores
ALTER TABLE "colaboradores" ADD COLUMN "numero" INTEGER;

UPDATE "colaboradores" AS c
SET "numero" = ordem.n
FROM (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "empresa_id" ORDER BY "criado_em", "id") AS n
  FROM "colaboradores"
) AS ordem
WHERE c."id" = ordem."id";

ALTER TABLE "colaboradores" ALTER COLUMN "numero" SET NOT NULL;

CREATE UNIQUE INDEX "colaboradores_empresa_id_numero_key" ON "colaboradores"("empresa_id", "numero");
