// Esqueleto das páginas de lista (painel, materiais, colaboradores, empréstimos).
export function CarregandoLista() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Carregando">
      <div className="bg-muted mb-2 h-8 w-48 rounded" />
      <div className="bg-muted mb-6 h-4 w-64 rounded" />
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="bg-muted h-20 rounded-xl" />
        <div className="bg-muted h-20 rounded-xl" />
        <div className="bg-muted hidden h-20 rounded-xl lg:block" />
        <div className="bg-muted hidden h-20 rounded-xl lg:block" />
      </div>
      <div className="bg-muted h-64 rounded-xl" />
    </div>
  );
}
