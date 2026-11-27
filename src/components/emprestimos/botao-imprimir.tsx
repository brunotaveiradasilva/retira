"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

// window.print() só existe no navegador: por isso este botão é um Client Component.
export function BotaoImprimir() {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer aria-hidden="true" /> Imprimir
    </Button>
  );
}
