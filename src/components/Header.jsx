import React, { useState, useRef, useEffect } from 'react';
import { PlusCircle, Save, Printer, History, Settings, Clipboard, ChevronDown, Menu, FileUp, Loader2, LogOut } from 'lucide-react';

export default function Header({ 
  onNew, 
  onSave, 
  onImportPDF,
  isImporting,
  onOpenHistory, 
  onOpenLibrary, 
  onPrintPage1,
  onPrintFull,
  onCopyPage1, 
  onCopyFull, 
  onCopyText, 
  onSendWhatsAppText,
  onShareImage,
  onSendWhatsAppLink,
  onCopyClientLink,
  isSaving,
  onLogout,
  userSession
}) {
  const [isCopyDropdownOpen, setIsCopyDropdownOpen] = useState(false);
  const [isPrintDropdownOpen, setIsPrintDropdownOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const printDropdownRef = useRef(null);
  const mobileDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCopyDropdownOpen(false);
      }
      if (printDropdownRef.current && !printDropdownRef.current.contains(event.target)) {
        setIsPrintDropdownOpen(false);
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target)) {
        setIsMobileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="no-print glassmorphism sticky top-0 z-40 w-full px-4 md:px-6 py-3 md:py-4 flex items-center justify-between border-b border-slate-800 shadow-lg h-[68px] md:h-[80px] box-border">
      {/* BRANDING */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-lg overflow-hidden border border-slate-700 flex items-center justify-center p-0.5 shrink-0">
          <img 
            src="/logo.png" 
            alt="Logo Júlio Peixer" 
            className="w-full h-full object-cover rounded"
          />
        </div>
        <div>
          <h1 className="text-base md:text-xl font-bold text-white tracking-wide m-0 leading-tight">Júlio Peixer</h1>
          <p className="text-[10px] md:text-xs font-semibold text-brand tracking-widest uppercase m-0 leading-tight">Pinturas</p>
        </div>
      </div>

      {/* AÇÕES DESKTOP (Tela grande) */}
      <div className="hidden lg:flex items-center gap-3">
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
          title="Iniciar um novo orçamento limpo"
        >
          <PlusCircle className="w-4.5 h-4.5 text-brand" />
          <span>Novo</span>
        </button>

        <button
          onClick={onImportPDF}
          disabled={isImporting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-100 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
          title="Importar projeto arquitetônico em PDF para gerar orçamento automaticamente"
        >
          {isImporting ? (
            <Loader2 className="w-4.5 h-4.5 text-brand animate-spin" />
          ) : (
            <FileUp className="w-4.5 h-4.5 text-brand" />
          )}
          <span>{isImporting ? 'Importando...' : 'Importar PDF'}</span>
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600 transition-all disabled:opacity-50 cursor-pointer"
          title="Salvar alterações no histórico"
        >
          <Save className="w-4.5 h-4.5 text-brand" />
          <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
        </button>

        {/* BOTÃO GERAR PDF (DROPDOWN) */}
        <div className="relative" ref={printDropdownRef}>
          <button
            onClick={() => setIsPrintDropdownOpen(!isPrintDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-brand hover:bg-brand-hover text-slate-950 shadow-md shadow-brand/10 transition-all cursor-pointer"
            title="Imprimir ou gerar PDF"
          >
            <Printer className="w-4.5 h-4.5" />
            <span>Gerar PDF</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-950/70" />
          </button>
          
          {isPrintDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-850 rounded-xl shadow-2xl z-50 p-1.5 space-y-0.5 text-left">
              <button
                type="button"
                onClick={() => {
                  onPrintPage1();
                  setIsPrintDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Imprimir: Apenas Página 1
              </button>
              <button
                type="button"
                onClick={() => {
                  onPrintFull();
                  setIsPrintDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Imprimir: Documento Completo
              </button>
            </div>
          )}
        </div>

        {/* BOTÃO COPIAR (DROPDOWN) */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsCopyDropdownOpen(!isCopyDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
            title="Copiar proposta para colar no WhatsApp"
          >
            <Clipboard className="w-4.5 h-4.5 text-brand" />
            <span>Copiar</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          
          {isCopyDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-850 rounded-xl shadow-2xl z-50 p-1.5 space-y-0.5 text-left">
              <div className="px-2.5 py-1 text-[9px] font-bold text-brand uppercase tracking-wider">WhatsApp Direto</div>
              <button
                type="button"
                onClick={() => {
                  onSendWhatsAppText();
                  setIsCopyDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
              >
                1. Enviar Resumo (Texto)
              </button>
              <button
                type="button"
                onClick={() => {
                  onShareImage();
                  setIsCopyDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
              >
                2. Compartilhar Imagem
              </button>
              <button
                type="button"
                onClick={() => {
                  onSendWhatsAppLink();
                  setIsCopyDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition cursor-pointer"
              >
                3. Enviar Link do Portal
              </button>
              
              <div className="h-px bg-slate-800 my-1"></div>
              <div className="px-2.5 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider">Copiar Manual</div>
              <button
                type="button"
                onClick={() => {
                  onCopyPage1();
                  setIsCopyDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Copiar Imagem: Apenas Página 1
              </button>
              <button
                type="button"
                onClick={() => {
                  onCopyFull();
                  setIsCopyDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Copiar Imagem: Documento Completo
              </button>
              <button
                type="button"
                onClick={() => {
                  onCopyText();
                  setIsCopyDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Copiar como Texto (WhatsApp)
              </button>
              <button
                type="button"
                onClick={() => {
                  onCopyClientLink();
                  setIsCopyDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Copiar Link do Portal
              </button>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-800"></div>

        <button
          onClick={onOpenHistory}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          title="Ver histórico de orçamentos salvos"
        >
          <History className="w-4.5 h-4.5" />
          <span>Histórico</span>
        </button>

        <button
          onClick={onOpenLibrary}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800/50 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
          title="Gerenciar biblioteca global de serviços"
        >
          <Settings className="w-4.5 h-4.5" />
          <span>Itens</span>
        </button>

        {userSession && (
          <>
            <div className="h-6 w-px bg-slate-800"></div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-950/20 hover:bg-red-950/50 text-red-400 border border-red-900/30 hover:border-red-900/60 transition-all cursor-pointer"
              title="Encerrar sessão"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>Sair</span>
            </button>
          </>
        )}
      </div>

      {/* AÇÕES MOBILE (Consolidado em um único botão "MENU") */}
      <div className="flex lg:hidden items-center gap-2" ref={mobileDropdownRef}>
        <div className="relative">
          <button
            onClick={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 shadow-md transition-all cursor-pointer"
            title="Menu de ações"
          >
            <Menu className="w-4 h-4 text-brand" />
            <span>MENU</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          
          {isMobileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-850 rounded-xl shadow-2xl z-50 p-1.5 space-y-0.5 text-left">
              <button
                type="button"
                onClick={() => {
                  onNew();
                  setIsMobileDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4 text-brand" />
                <span>Novo Orçamento</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onImportPDF();
                  setIsMobileDropdownOpen(false);
                }}
                disabled={isImporting}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isImporting ? (
                  <Loader2 className="w-4 h-4 text-brand animate-spin" />
                ) : (
                  <FileUp className="w-4 h-4 text-brand" />
                )}
                <span>{isImporting ? 'Importando...' : 'Importar PDF'}</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  onSave();
                  setIsMobileDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
              >
                <Save className="w-4 h-4 text-brand" />
                <span>Salvar Orçamento</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  onOpenHistory();
                  setIsMobileDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
              >
                <History className="w-4 h-4 text-brand" />
                <span>Histórico</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  onOpenLibrary();
                  setIsMobileDropdownOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
              >
                <Settings className="w-4 h-4 text-brand" />
                <span>Itens</span>
              </button>

              {userSession && (
                <>
                  <div className="h-px bg-slate-800 my-1"></div>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setIsMobileDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 hover:bg-slate-800 transition cursor-pointer flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Sair</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
