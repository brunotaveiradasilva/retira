"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

// FILTROS QUE MORAM NA URL
//
// Em vez de guardar a busca num useState, gravamos em ?busca=...
// Vantagens: o filtro sobrevive ao F5, dá pra mandar o link pra alguém, o botão
// "voltar" do navegador funciona, e a PÁGINA (Server Component) lê searchParams e
// filtra no banco. O cliente só muda a URL; quem busca os dados é o servidor.

/** Hook: troca um parâmetro da URL sem empilhar no histórico. */
function useParametroDaUrl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // useTransition: enquanto o servidor monta a página nova, `pendente` = true
  // e a tela antiga continua visível (sem piscar o esqueleto).
  const [pendente, iniciarTransicao] = useTransition();

  function definir(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams);
    if (valor) params.set(chave, valor);
    else params.delete(chave);
    params.delete("pagina"); // filtro novo → volta pra página 1
    const busca = params.toString();
    iniciarTransicao(() => {
      // replace (e não push): digitar a busca não cria 10 entradas no "voltar".
      router.replace(busca ? `${pathname}?${busca}` : pathname, {
        scroll: false,
      });
    });
  }

  return {
    valorAtual: (chave: string) => searchParams.get(chave) ?? "",
    definir,
    pendente,
  };
}

/** Linha que agrupa os filtros acima de uma lista. */
export function BarraDeFiltros({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>
  );
}

export function CampoBusca({
  parametro = "busca",
  placeholder = "Buscar...",
}: {
  parametro?: string;
  placeholder?: string;
}) {
  const { valorAtual, definir, pendente } = useParametroDaUrl();
  // O texto do input fica num estado local (responde a cada tecla)...
  const [texto, setTexto] = useState(valorAtual(parametro));
  // useRef: uma "caixinha" que guarda um valor entre redesenhos SEM causar redesenho.
  // Aqui guarda o temporizador pendente.
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ...e só vai pra URL 300 ms depois que a pessoa PARA de digitar ("debounce").
  // Sem isso, "furadeira" faria 9 buscas no banco. A lógica fica no próprio evento
  // de digitação (nada de useEffect, como na fase 3).
  function aoDigitar(novo: string, esperar = 300) {
    setTexto(novo);
    clearTimeout(temporizador.current); // digitou de novo? cancela a busca anterior
    temporizador.current = setTimeout(
      () => definir(parametro, novo.trim()),
      esperar,
    );
  }

  return (
    <div className="relative w-full sm:w-64">
      <Search
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={texto}
        onChange={(evento) => aoDigitar(evento.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn("pl-8", pendente && "opacity-60")}
      />
      {texto && (
        <button
          type="button"
          onClick={() => aoDigitar("", 0)}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
          aria-label="Limpar busca"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function FiltroSelect({
  parametro,
  rotulo,
  opcoes,
}: {
  parametro: string;
  rotulo: string;
  /** value "" = sem filtro */
  opcoes: { valor: string; rotulo: string }[];
}) {
  const { valorAtual, definir, pendente } = useParametroDaUrl();
  return (
    <NativeSelect
      aria-label={rotulo}
      value={valorAtual(parametro)}
      onChange={(evento) => definir(parametro, evento.target.value)}
      className={cn("w-full sm:w-auto", pendente && "opacity-60")}
    >
      {opcoes.map((opcao) => (
        <NativeSelectOption key={opcao.valor} value={opcao.valor}>
          {opcao.rotulo}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

export function FiltroCheckbox({
  parametro,
  rotulo,
}: {
  parametro: string;
  rotulo: string;
}) {
  const { valorAtual, definir, pendente } = useParametroDaUrl();
  return (
    <label
      className={cn(
        "text-muted-foreground flex cursor-pointer items-center gap-2 text-sm",
        pendente && "opacity-60",
      )}
    >
      <input
        type="checkbox"
        className="accent-primary size-4"
        checked={valorAtual(parametro) === "1"}
        onChange={(evento) =>
          definir(parametro, evento.target.checked ? "1" : "")
        }
      />
      {rotulo}
    </label>
  );
}
