"use client";

import React, { createContext, useContext, useState } from "react";

type Language = "pt" | "es";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  pt: {
    "common.filter": "Filtrar",
    "common.search": "Buscar",
    "common.save": "Salvar",
    "common.cancel": "Cancelar",
    "common.delete": "Excluir",
    "common.edit": "Editar",
    "common.loading": "Carregando...",
    "common.actions": "Acoes",
    "dashboard.welcome": "Bem-vindo ao AXIS ERP",
    "reports.filters.type": "Tipo de Relatorio",
    "reports.filters.exportPDF": "Exportar PDF",
    "reports.table.date": "Data",
    "reports.table.total": "Total",
    "suppliers.title": "Fornecedores",
    "suppliers.newSupplier": "Novo Fornecedor",
    "inventory.title": "Estoque",
    "inventory.adjustStock": "Ajustar Estoque",
    "accounting.title": "Contabilidade",
    "accounting.description": "Lancamentos contabeis",
  },
  es: {
    "common.filter": "Filtrar",
    "common.search": "Buscar",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.delete": "Eliminar",
    "common.edit": "Editar",
    "common.loading": "Cargando...",
    "common.actions": "Acciones",
    "dashboard.welcome": "Bienvenido a AXIS ERP",
    "reports.filters.type": "Tipo de Reporte",
    "reports.filters.exportPDF": "Exportar PDF",
    "reports.table.date": "Fecha",
    "reports.table.total": "Total",
    "suppliers.title": "Proveedores",
    "suppliers.newSupplier": "Nuevo Proveedor",
    "inventory.title": "Inventario",
    "inventory.adjustStock": "Ajustar Inventario",
    "accounting.title": "Contabilidad",
    "accounting.description": "Asientos contables",
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: "pt",
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("pt");

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
