// Tipos do domínio do Retira.
// Na fase 2 o Prisma gera esses tipos sozinho a partir do schema do banco,
// e este arquivo vai embora. Por enquanto escrevemos à mão pra entender a forma dos dados.

// "Union type": a variável só pode ter um desses textos. Qualquer outro é erro de tipo.
export type Controle = "UNITARIO" | "QUANTIDADE";
export type EstadoMaterial = "BOM" | "DANIFICADO" | "MANUTENCAO" | "BAIXADO";
export type StatusEmprestimo = "ABERTO" | "PARCIAL" | "DEVOLVIDO";

export type TipoMaterial = {
  id: string;
  nome: string;
};

export type Material = {
  id: string;
  nome: string;
  codigo?: string; // "?" = opcional: pode não existir
  tipoId: string; // aponta para TipoMaterial.id
  controle: Controle;
  quantidade: number; // UNITARIO é sempre 1
  estado: EstadoMaterial;
};

export type Colaborador = {
  id: string;
  nome: string;
  matricula?: string;
  setor?: string;
  telefone?: string;
  ativo: boolean;
};

export type ItemEmprestimo = {
  materialId: string;
  quantidade: number;
  devolvidoEm?: Date;
};

export type Emprestimo = {
  id: string;
  colaboradorId: string;
  retiradoEm: Date;
  previsaoDevolucao?: Date;
  status: StatusEmprestimo;
  observacao?: string;
  itens: ItemEmprestimo[]; // um empréstimo tem vários itens
};
