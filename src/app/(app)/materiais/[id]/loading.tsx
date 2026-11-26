import { CarregandoDetalhe } from "@/components/app/carregando-detalhe";

// loading.tsx = o Next embrulha a page.tsx desta pasta num <Suspense> e mostra isto
// enquanto ela não fica pronta. Em rota dinâmica ([id]) isso deixa a navegação instantânea:
// o esqueleto aparece na hora e o conteúdo chega logo depois.
export default function Loading() {
  return <CarregandoDetalhe />;
}
