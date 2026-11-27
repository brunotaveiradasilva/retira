-- AlterTable
ALTER TABLE "emprestimos" ADD COLUMN     "data_evento" TIMESTAMP(3),
ADD COLUMN     "endereco_evento" TEXT,
ADD COLUMN     "local_evento" TEXT;
