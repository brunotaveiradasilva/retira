-- Remove os "tipos de material" (decisão de 27/11/2026: o campo não era necessário).
-- ATENÇÃO: apaga dados. Os materiais continuam; só perdem o tipo. A tabela de tipos some.

-- DropForeignKey
ALTER TABLE "materiais" DROP CONSTRAINT "materiais_tipo_id_fkey";

-- DropForeignKey
ALTER TABLE "tipos_material" DROP CONSTRAINT "tipos_material_empresa_id_fkey";

-- AlterTable
ALTER TABLE "materiais" DROP COLUMN "tipo_id";

-- DropTable
DROP TABLE "tipos_material";

