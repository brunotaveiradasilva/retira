import { CarregandoLista } from "@/components/app/carregando-lista";

// Cada página que lê o banco tem o seu loading.tsx na PRÓPRIA pasta.
// Um loading.tsx só na pasta (app) não serve: ao navegar entre páginas irmãs,
// o Next só redesenha o que fica abaixo do layout compartilhado, e ele ficaria acima.
export default function Loading() {
  return <CarregandoLista />;
}
