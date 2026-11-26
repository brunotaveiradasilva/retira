import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Por padrão, todo componente do App Router é um Server Component:
// roda no servidor e manda só HTML pro navegador. Sem "use client", sem useState.

type Recurso = {
  titulo: string;
  descricao: string;
};

const recursos: Recurso[] = [
  {
    titulo: "Materiais",
    descricao: "Cadastre ferramentas, EPIs e equipamentos por tipo.",
  },
  {
    titulo: "Colaboradores",
    descricao: "Saiba quem está com o quê e desde quando.",
  },
  {
    titulo: "Retiradas",
    descricao: "Registre a saída e a devolução em poucos cliques.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-6 py-16">
      <header className="flex items-center justify-between">
        <Logo size={36} />
        <Button variant="outline" disabled>
          Entrar
        </Button>
      </header>

      <section className="flex flex-col gap-4">
        <h1 className="text-4xl font-medium tracking-tight sm:text-5xl">
          Saiba com quem está cada material.
        </h1>
        <p className="text-muted-foreground max-w-xl text-lg">
          O Retira organiza o almoxarifado da sua empresa: o que saiu, quem
          retirou e quando precisa voltar.
        </p>
        <div>
          <Button size="lg" disabled>
            Criar conta da empresa
          </Button>
          <p className="text-muted-foreground mt-2 text-sm">
            Em construção · fase 0
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {/* .map transforma cada item do array num Card. A `key` ajuda o React a identificar cada um. */}
        {recursos.map((recurso) => (
          <Card key={recurso.titulo}>
            <CardHeader>
              <CardTitle>{recurso.titulo}</CardTitle>
              <CardDescription>{recurso.descricao}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </section>
    </main>
  );
}
