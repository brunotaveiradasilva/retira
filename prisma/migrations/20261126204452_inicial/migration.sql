-- CreateEnum
CREATE TYPE "Controle" AS ENUM ('UNITARIO', 'QUANTIDADE');

-- CreateEnum
CREATE TYPE "EstadoMaterial" AS ENUM ('BOM', 'DANIFICADO', 'MANUTENCAO', 'BAIXADO');

-- CreateEnum
CREATE TYPE "StatusEmprestimo" AS ENUM ('ABERTO', 'PARCIAL', 'DEVOLVIDO');

-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empresas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_material" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,

    CONSTRAINT "tipos_material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materiais" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "codigo" TEXT,
    "controle" "Controle" NOT NULL DEFAULT 'UNITARIO',
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "estado" "EstadoMaterial" NOT NULL DEFAULT 'BOM',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,

    CONSTRAINT "materiais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "colaboradores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "matricula" TEXT,
    "setor" TEXT,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "empresa_id" TEXT NOT NULL,

    CONSTRAINT "colaboradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emprestimos" (
    "id" TEXT NOT NULL,
    "retirado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previsao_devolucao" TIMESTAMP(3),
    "status" "StatusEmprestimo" NOT NULL DEFAULT 'ABERTO',
    "observacao" TEXT,
    "colaborador_id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,

    CONSTRAINT "emprestimos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_emprestimo" (
    "id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "devolvido_em" TIMESTAMP(3),
    "emprestimo_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,

    CONSTRAINT "itens_emprestimo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_material_empresa_id_nome_key" ON "tipos_material"("empresa_id", "nome");

-- CreateIndex
CREATE INDEX "materiais_empresa_id_idx" ON "materiais"("empresa_id");

-- CreateIndex
CREATE UNIQUE INDEX "materiais_empresa_id_codigo_key" ON "materiais"("empresa_id", "codigo");

-- CreateIndex
CREATE INDEX "colaboradores_empresa_id_idx" ON "colaboradores"("empresa_id");

-- CreateIndex
CREATE INDEX "emprestimos_empresa_id_status_idx" ON "emprestimos"("empresa_id", "status");

-- CreateIndex
CREATE INDEX "itens_emprestimo_material_id_idx" ON "itens_emprestimo"("material_id");

-- AddForeignKey
ALTER TABLE "tipos_material" ADD CONSTRAINT "tipos_material_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais" ADD CONSTRAINT "materiais_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "tipos_material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materiais" ADD CONSTRAINT "materiais_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "colaboradores" ADD CONSTRAINT "colaboradores_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprestimos" ADD CONSTRAINT "emprestimos_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emprestimos" ADD CONSTRAINT "emprestimos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_emprestimo" ADD CONSTRAINT "itens_emprestimo_emprestimo_id_fkey" FOREIGN KEY ("emprestimo_id") REFERENCES "emprestimos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_emprestimo" ADD CONSTRAINT "itens_emprestimo_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materiais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
