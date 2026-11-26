import type { ReactNode } from "react";

type PageHeaderProps = {
  titulo: string;
  descricao?: string;
  /** Botões à direita do título. ReactNode = qualquer coisa que o React sabe desenhar. */
  acoes?: ReactNode;
  /** Algo acima do título, como um link "voltar". */
  topo?: ReactNode;
};

export function PageHeader({
  titulo,
  descricao,
  acoes,
  topo,
}: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      {topo}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">{titulo}</h1>
          {descricao && (
            <p className="text-muted-foreground mt-1 text-sm">{descricao}</p>
          )}
        </div>
        {acoes}
      </div>
    </div>
  );
}
