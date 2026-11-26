// Coloca dados de exemplo no banco. Rode com `npm run db:seed`.
// Apaga tudo antes, então pode rodar quantas vezes quiser.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { gerarHashDeSenha } from "../src/lib/senha";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Datas relativas ao momento do seed: dia(-3) = 3 dias atrás.
function dia(deslocamento: number): Date {
  const data = new Date();
  data.setDate(data.getDate() + deslocamento);
  return data;
}

async function main() {
  // Ordem importa: primeiro quem depende (filhos), depois de quem se depende (pais).
  await prisma.itemEmprestimo.deleteMany();
  await prisma.emprestimo.deleteMany();
  await prisma.material.deleteMany();
  await prisma.tipoMaterial.deleteMany();
  await prisma.colaborador.deleteMany();
  await prisma.sessao.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.empresa.deleteMany();

  const empresa = await prisma.empresa.create({
    data: { nome: "Construtora Exemplo", cnpj: "00.000.000/0001-00" },
  });
  const empresaId = empresa.id;

  // LOGINS DE EXEMPLO (só para desenvolvimento; a tela de login mostra o primeiro).
  //   admin@exemplo.com  / retira123  → Construtora Exemplo (dados completos)
  //   oficina@exemplo.com / retira123 → Oficina do Zé (outra empresa, pra testar
  //                                      que uma empresa não vê os dados da outra)
  await prisma.usuario.create({
    data: {
      nome: "Admin Exemplo",
      email: "admin@exemplo.com",
      senhaHash: await gerarHashDeSenha("retira123"),
      empresaId,
    },
  });

  const oficina = await prisma.empresa.create({
    data: { nome: "Oficina do Zé" },
  });
  await prisma.usuario.create({
    data: {
      nome: "Zé da Oficina",
      email: "oficina@exemplo.com",
      senhaHash: await gerarHashDeSenha("retira123"),
      empresaId: oficina.id,
    },
  });
  const chaves = await prisma.tipoMaterial.create({
    data: { nome: "Chaves", empresaId: oficina.id },
  });
  await prisma.material.create({
    data: {
      nome: "Jogo de chaves combinadas",
      tipoId: chaves.id,
      empresaId: oficina.id,
    },
  });
  await prisma.colaborador.create({
    data: { nome: "Bia Mecânica", setor: "Oficina", empresaId: oficina.id },
  });

  // create devolve o registro criado, com o id gerado pelo banco.
  const ferramentas = await prisma.tipoMaterial.create({
    data: { nome: "Ferramentas", empresaId },
  });
  const epis = await prisma.tipoMaterial.create({
    data: { nome: "EPIs", empresaId },
  });
  const ti = await prisma.tipoMaterial.create({
    data: { nome: "Equipamentos de TI", empresaId },
  });

  // Helper local pra não repetir empresaId em todo material.
  // Prisma.MaterialUncheckedCreateInput é o tipo gerado do "data" de criar material com ids;
  // Omit<..., "empresaId"> = o mesmo tipo sem o campo empresaId (o helper preenche).
  const material = (
    dados: Omit<Prisma.MaterialUncheckedCreateInput, "empresaId">,
  ) => prisma.material.create({ data: { ...dados, empresaId } });

  const furadeira = await material({
    nome: "Furadeira Bosch GSB 13",
    codigo: "FER-001",
    tipoId: ferramentas.id,
  });
  const parafusadeira = await material({
    nome: "Parafusadeira Makita",
    codigo: "FER-002",
    tipoId: ferramentas.id,
  });
  await material({
    nome: 'Esmerilhadeira 4½"',
    codigo: "FER-003",
    tipoId: ferramentas.id,
    estado: "MANUTENCAO",
  });
  const trena = await material({
    nome: "Trena 5 m",
    tipoId: ferramentas.id,
    controle: "QUANTIDADE",
    quantidade: 8,
  });
  const capacete = await material({
    nome: "Capacete de segurança",
    tipoId: epis.id,
    controle: "QUANTIDADE",
    quantidade: 20,
  });
  const oculos = await material({
    nome: "Óculos de proteção",
    tipoId: epis.id,
    controle: "QUANTIDADE",
    quantidade: 15,
  });
  await material({
    nome: "Cinto paraquedista",
    codigo: "EPI-010",
    tipoId: epis.id,
    estado: "DANIFICADO",
  });
  const notebook = await material({
    nome: "Notebook Dell Latitude",
    codigo: "TI-001",
    tipoId: ti.id,
  });
  const projetor = await material({
    nome: "Projetor Epson",
    codigo: "TI-002",
    tipoId: ti.id,
  });
  const radio = await material({
    nome: "Rádio comunicador",
    tipoId: ti.id,
    controle: "QUANTIDADE",
    quantidade: 6,
  });

  const ana = await prisma.colaborador.create({
    data: {
      nome: "Ana Souza",
      matricula: "1023",
      setor: "Manutenção",
      telefone: "(51) 99876-1234",
      empresaId,
    },
  });
  const carlos = await prisma.colaborador.create({
    data: {
      nome: "Carlos Lima",
      matricula: "1041",
      setor: "Obras",
      telefone: "(51) 99123-4567",
      empresaId,
    },
  });
  const juliana = await prisma.colaborador.create({
    data: { nome: "Juliana Reis", matricula: "1055", setor: "TI", empresaId },
  });
  const marcos = await prisma.colaborador.create({
    data: {
      nome: "Marcos Pereira",
      matricula: "1060",
      setor: "Obras",
      empresaId,
    },
  });
  await prisma.colaborador.create({
    data: {
      nome: "Paula Martins",
      matricula: "0987",
      setor: "Comercial",
      ativo: false,
      empresaId,
    },
  });

  // "Nested write": cria o empréstimo e os itens dele numa operação só.
  await prisma.emprestimo.create({
    data: {
      empresaId,
      colaboradorId: ana.id,
      retiradoEm: dia(-2),
      previsaoDevolucao: dia(3),
      itens: {
        create: [{ materialId: furadeira.id }, { materialId: capacete.id }],
      },
    },
  });

  await prisma.emprestimo.create({
    data: {
      empresaId,
      colaboradorId: carlos.id,
      retiradoEm: dia(-10),
      previsaoDevolucao: dia(-3), // atrasado
      observacao: "Obra da Rua Independência",
      itens: {
        create: [
          { materialId: parafusadeira.id },
          { materialId: trena.id, quantidade: 2 },
          { materialId: oculos.id, quantidade: 2 },
        ],
      },
    },
  });

  await prisma.emprestimo.create({
    data: {
      empresaId,
      colaboradorId: juliana.id,
      retiradoEm: dia(-5),
      previsaoDevolucao: dia(-1), // atrasado
      status: "PARCIAL",
      itens: {
        create: [
          { materialId: notebook.id },
          { materialId: radio.id, quantidade: 2, devolvidoEm: dia(-1) },
        ],
      },
    },
  });

  await prisma.emprestimo.create({
    data: {
      empresaId,
      colaboradorId: marcos.id,
      retiradoEm: dia(-20),
      previsaoDevolucao: dia(-15),
      status: "DEVOLVIDO",
      itens: {
        create: [
          { materialId: projetor.id, devolvidoEm: dia(-16) },
          { materialId: furadeira.id, devolvidoEm: dia(-16) },
        ],
      },
    },
  });

  await prisma.emprestimo.create({
    data: {
      empresaId,
      colaboradorId: marcos.id,
      retiradoEm: dia(-1), // sem previsão de devolução
      itens: { create: [{ materialId: capacete.id, quantidade: 3 }] },
    },
  });

  const contagem = {
    materiais: await prisma.material.count(),
    colaboradores: await prisma.colaborador.count(),
    emprestimos: await prisma.emprestimo.count(),
  };
  console.log("Seed concluído:", contagem);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
