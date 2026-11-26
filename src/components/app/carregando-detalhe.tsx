// Esqueleto cinza que aparece enquanto a página de detalhe carrega.
// animate-pulse faz os blocos "piscarem" devagar.
export function CarregandoDetalhe() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Carregando">
      <div className="bg-muted mb-4 h-4 w-28 rounded" />
      <div className="bg-muted mb-2 h-8 w-64 rounded" />
      <div className="bg-muted mb-8 h-4 w-40 rounded" />
      <div className="bg-muted mb-8 h-24 rounded-xl" />
      <div className="bg-muted h-40 rounded-xl" />
    </div>
  );
}
