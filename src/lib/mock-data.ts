import type { Colaborador, Emprestimo, Material, TipoMaterial } from "@/types";

// Dados falsos da fase 1. Na fase 2 tudo isso vem do banco (Prisma + Postgres).

// Data "de hoje" fixa: deixa as telas sempre iguais (bom pra estudar) e evita usar
// new Date() durante o build, que o Next 16 com Cache Components não deixa sem cuidado extra.
export const HOJE = new Date("2026-11-26T12:00:00");

// Atalho pra criar datas relativas a HOJE: dia(-3) = 3 dias atrás.
function dia(deslocamento: number): Date {
  const data = new Date(HOJE);
  data.setDate(data.getDate() + deslocamento);
  return data;
}

export const tipos: TipoMaterial[] = [
  { id: "t1", nome: "Ferramentas" },
  { id: "t2", nome: "EPIs" },
  { id: "t3", nome: "Equipamentos de TI" },
];

export const materiais: Material[] = [
  {
    id: "m1",
    nome: "Furadeira Bosch GSB 13",
    codigo: "FER-001",
    tipoId: "t1",
    controle: "UNITARIO",
    quantidade: 1,
    estado: "BOM",
  },
  {
    id: "m2",
    nome: "Parafusadeira Makita",
    codigo: "FER-002",
    tipoId: "t1",
    controle: "UNITARIO",
    quantidade: 1,
    estado: "BOM",
  },
  {
    id: "m3",
    nome: 'Esmerilhadeira 4½"',
    codigo: "FER-003",
    tipoId: "t1",
    controle: "UNITARIO",
    quantidade: 1,
    estado: "MANUTENCAO",
  },
  {
    id: "m4",
    nome: "Trena 5 m",
    tipoId: "t1",
    controle: "QUANTIDADE",
    quantidade: 8,
    estado: "BOM",
  },
  {
    id: "m5",
    nome: "Capacete de segurança",
    tipoId: "t2",
    controle: "QUANTIDADE",
    quantidade: 20,
    estado: "BOM",
  },
  {
    id: "m6",
    nome: "Óculos de proteção",
    tipoId: "t2",
    controle: "QUANTIDADE",
    quantidade: 15,
    estado: "BOM",
  },
  {
    id: "m7",
    nome: "Cinto paraquedista",
    codigo: "EPI-010",
    tipoId: "t2",
    controle: "UNITARIO",
    quantidade: 1,
    estado: "DANIFICADO",
  },
  {
    id: "m8",
    nome: "Notebook Dell Latitude",
    codigo: "TI-001",
    tipoId: "t3",
    controle: "UNITARIO",
    quantidade: 1,
    estado: "BOM",
  },
  {
    id: "m9",
    nome: "Projetor Epson",
    codigo: "TI-002",
    tipoId: "t3",
    controle: "UNITARIO",
    quantidade: 1,
    estado: "BOM",
  },
  {
    id: "m10",
    nome: "Rádio comunicador",
    tipoId: "t3",
    controle: "QUANTIDADE",
    quantidade: 6,
    estado: "BOM",
  },
];

export const colaboradores: Colaborador[] = [
  {
    id: "c1",
    nome: "Ana Souza",
    matricula: "1023",
    setor: "Manutenção",
    telefone: "(51) 99876-1234",
    ativo: true,
  },
  {
    id: "c2",
    nome: "Carlos Lima",
    matricula: "1041",
    setor: "Obras",
    telefone: "(51) 99123-4567",
    ativo: true,
  },
  {
    id: "c3",
    nome: "Juliana Reis",
    matricula: "1055",
    setor: "TI",
    ativo: true,
  },
  {
    id: "c4",
    nome: "Marcos Pereira",
    matricula: "1060",
    setor: "Obras",
    ativo: true,
  },
  {
    id: "c5",
    nome: "Paula Martins",
    matricula: "0987",
    setor: "Comercial",
    ativo: false,
  },
];

export const emprestimos: Emprestimo[] = [
  {
    id: "e1",
    colaboradorId: "c1",
    retiradoEm: dia(-2),
    previsaoDevolucao: dia(3),
    status: "ABERTO",
    itens: [
      { materialId: "m1", quantidade: 1 },
      { materialId: "m5", quantidade: 1 },
    ],
  },
  {
    id: "e2",
    colaboradorId: "c2",
    retiradoEm: dia(-10),
    previsaoDevolucao: dia(-3), // já passou: atrasado
    status: "ABERTO",
    observacao: "Obra da Rua Independência",
    itens: [
      { materialId: "m2", quantidade: 1 },
      { materialId: "m4", quantidade: 2 },
      { materialId: "m6", quantidade: 2 },
    ],
  },
  {
    id: "e3",
    colaboradorId: "c3",
    retiradoEm: dia(-5),
    previsaoDevolucao: dia(-1),
    status: "PARCIAL",
    itens: [
      { materialId: "m8", quantidade: 1 },
      { materialId: "m10", quantidade: 2, devolvidoEm: dia(-1) },
    ],
  },
  {
    id: "e4",
    colaboradorId: "c4",
    retiradoEm: dia(-20),
    previsaoDevolucao: dia(-15),
    status: "DEVOLVIDO",
    itens: [
      { materialId: "m9", quantidade: 1, devolvidoEm: dia(-16) },
      { materialId: "m1", quantidade: 1, devolvidoEm: dia(-16) },
    ],
  },
  {
    id: "e5",
    colaboradorId: "c4",
    retiradoEm: dia(-1),
    status: "ABERTO", // sem previsão de devolução
    itens: [{ materialId: "m5", quantidade: 3 }],
  },
];
