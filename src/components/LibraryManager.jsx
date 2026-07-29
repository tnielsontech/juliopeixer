import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, RotateCcw, AlertTriangle, Search, Layers, Cloud, Sparkles, CheckCircle, Info, HelpCircle, BarChart3, Database, Settings } from 'lucide-react';
import { db } from '../services/db';

export default function LibraryManager({ isOpen, onClose, library, onSaveLibrary, budgets = [] }) {
  if (!isOpen) return null;

  const categories = ["PREPARAÇÃO", "PINTURA", "REVESTIMENTOS", "EFEITOS DECORATIVOS", "EQUIPAMENTOS E DIFERENCIAIS"];
  const unitSuggestions = ["m²", "un", "cômodo", "dia", "m.l.", "global"];

  // Estados principais
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'settings'
  const [selectedCategory, setSelectedCategory] = useState('TODOS'); // 'TODOS' | categories
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controle de edição (Formulário Lateral)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null significa "Adicionar Novo"
  const [formData, setFormData] = useState({
    name: '',
    category: 'PREPARAÇÃO',
    defaultText: '',
    unit: '',
    unitPrice: '',
    active: true
  });
  
  // Estado para confirmação de reset
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Estados para Planilha Google
  const [apiUrl, setApiUrl] = useState(localStorage.getItem("jp_google_api_url") || '');
  const [showInstructions, setShowInstructions] = useState(false);
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem("jp_gemini_api_key") || '');

  // Estados para Supabase e Provedor de Nuvem
  const [supabaseUrl, setSupabaseUrl] = useState(localStorage.getItem("jp_supabase_url") || '');
  const [supabaseKey, setSupabaseKey] = useState(localStorage.getItem("jp_supabase_anon_key") || '');
  const [syncProvider, setSyncProvider] = useState(localStorage.getItem("jp_sync_provider") || (localStorage.getItem("jp_supabase_url") ? "supabase" : localStorage.getItem("jp_google_api_url") ? "sheets" : "local"));

  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === '') return '—';
    const num = parseFloat(val) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleSaveApiUrl = async () => {
    const cleanUrl = apiUrl.trim();
    if (cleanUrl) {
      if (!cleanUrl.startsWith("https://script.google.com/")) {
        alert("Por favor, cole uma URL válida do Google Apps Script (iniciando com https://script.google.com/)");
        return;
      }

      // Migração automática de dados locais para o Sheets
      try {
        const localBudgets = JSON.parse(localStorage.getItem("jp_budgets") || '[]');
        
        if (localBudgets.length > 0) {
          const confirmMigration = confirm(
            `Detectamos que você possui ${localBudgets.length} orçamento(s) salvo(s) localmente neste aparelho. Deseja enviar estes orçamentos para a planilha em nuvem agora para não perder nenhum dado?`
          );
          
          if (confirmMigration) {
            alert("Iniciando envio dos orçamentos locais para a nuvem. Por favor, aguarde...");
            for (const b of localBudgets) {
              await fetch(cleanUrl, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: "saveBudget", budget: b })
              });
            }
            alert("Orçamentos migrados com sucesso para a planilha Google!");
          }
        }
      } catch (err) {
        console.error("Erro na migração:", err);
        alert("Aviso: Não foi possível migrar os dados locais para a nuvem. Verifique a URL ou sua conexão.");
      }

      localStorage.setItem("jp_google_api_url", cleanUrl);
      alert("Planilha conectada com sucesso! O sistema será recarregado.");
      window.location.reload();
    } else {
      alert("Digite uma URL antes de salvar.");
    }
  };

  const handleDisconnect = () => {
    if (confirm("Desconectar o Google Sheets? O sistema voltará a salvar localmente neste aparelho.")) {
      localStorage.removeItem("jp_google_api_url");
      setApiUrl('');
      alert("Desconectado! O sistema recarregará.");
      window.location.reload();
    }
  };

  const handleSaveGeminiKey = () => {
    const cleanKey = geminiKey.trim();
    if (cleanKey) {
      localStorage.setItem("jp_gemini_api_key", cleanKey);
      alert("Chave API do Gemini salva com sucesso!");
    } else {
      alert("Digite uma chave antes de salvar.");
    }
  };

  const handleDeleteGeminiKey = () => {
    if (confirm("Remover a chave API do Gemini?")) {
      localStorage.removeItem("jp_gemini_api_key");
      setGeminiKey('');
      alert("Chave API do Gemini removida.");
    }
  };

  const handleSaveSupabase = () => {
    const cleanUrl = supabaseUrl.trim().replace(/\/$/, '');
    const cleanKey = supabaseKey.trim();
    if (cleanUrl && cleanKey) {
      localStorage.setItem("jp_supabase_url", cleanUrl);
      localStorage.setItem("jp_supabase_anon_key", cleanKey);
      localStorage.setItem("jp_sync_provider", "supabase"); // auto select provider
      setSyncProvider("supabase");
      alert("Conexão com Supabase salva com sucesso! O provedor foi definido para Supabase e o sistema será recarregado.");
      window.location.reload();
    } else {
      alert("Preencha a URL e a Anon Key antes de salvar.");
    }
  };

  const handleDisconnectSupabase = () => {
    if (confirm("Desconectar do Supabase?")) {
      localStorage.removeItem("jp_supabase_url");
      localStorage.removeItem("jp_supabase_anon_key");
      localStorage.setItem("jp_sync_provider", "local");
      setSupabaseUrl('');
      setSupabaseKey('');
      setSyncProvider("local");
      alert("Supabase desconectado. O sistema voltará ao modo local e será recarregado.");
      window.location.reload();
    }
  };

  const handleSyncProviderChange = (val) => {
    localStorage.setItem("jp_sync_provider", val);
    setSyncProvider(val);
    alert(`Provedor de nuvem alterado para: ${val === 'local' ? 'Armazenamento Local' : val === 'sheets' ? 'Google Sheets' : 'Supabase'}. O sistema recarregará.`);
    window.location.reload();
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name,
      category: item.category,
      defaultText: item.defaultText,
      unit: item.unit || '',
      unitPrice: item.unitPrice !== undefined ? String(item.unitPrice) : '',
      active: item.active
    });
    setIsFormOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: selectedCategory !== 'TODOS' ? selectedCategory : 'PREPARAÇÃO',
      defaultText: '',
      unit: '',
      unitPrice: '',
      active: true
    });
    setIsFormOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      category: 'PREPARAÇÃO',
      defaultText: '',
      unit: '',
      unitPrice: '',
      active: true
    });
    setIsFormOpen(false);
  };

  const handleDeleteClick = (id) => {
    if (confirm("Tem certeza que deseja excluir permanentemente este item da biblioteca global? Os orçamentos já criados não serão afetados.")) {
      const updated = library.filter(item => item.id !== id);
      onSaveLibrary(updated);
      if (editingId === id) {
        handleCancelEdit();
      }
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.defaultText.trim()) {
      alert("Preencha o Nome e a Descrição do PDF.");
      return;
    }

    let updatedLibrary = [...library];

    const itemData = {
      name: formData.name.trim(),
      category: formData.category,
      defaultText: formData.defaultText.trim(),
      unit: formData.unit.trim() || undefined,
      unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) || 0 : undefined,
      active: formData.active
    };

    if (editingId) {
      // Editar existente
      updatedLibrary = library.map(item => {
        if (item.id === editingId) {
          return {
            ...item,
            ...itemData
          };
        }
        return item;
      });
    } else {
      // Criar novo com ID único
      const newId = `custom-${Date.now()}`;
      updatedLibrary.push({
        id: newId,
        ...itemData
      });
    }

    onSaveLibrary(updatedLibrary);
    handleCancelEdit();
  };

  const handleResetLibrary = async () => {
    const defaults = await db.resetLibrary();
    onSaveLibrary(defaults);
    setShowResetConfirm(false);
    handleCancelEdit();
  };

  // Cálculos do Dashboard Financeiro
  const totalBudgets = budgets.length;
  const totalValue = budgets.reduce((acc, curr) => acc + (parseFloat(curr.value) || 0), 0);

  const statusStats = {
    'Em elaboração': { count: 0, sum: 0, colorClass: 'text-blue-450', bgClass: 'bg-blue-500/10 border-blue-500/20' },
    'Enviado': { count: 0, sum: 0, colorClass: 'text-yellow-450', bgClass: 'bg-yellow-500/10 border-yellow-500/20' },
    'Aprovado': { count: 0, sum: 0, colorClass: 'text-brand', bgClass: 'bg-brand/10 border-brand/20' },
    'Em execução': { count: 0, sum: 0, colorClass: 'text-purple-450', bgClass: 'bg-purple-500/10 border-purple-500/20' },
    'Finalizado': { count: 0, sum: 0, colorClass: 'text-slate-400', bgClass: 'bg-slate-500/10 border-slate-500/20' },
    'Recusado': { count: 0, sum: 0, colorClass: 'text-red-450', bgClass: 'bg-red-500/10 border-red-500/20' },
  };

  budgets.forEach(b => {
    const status = b.status || 'Em elaboração';
    const val = parseFloat(b.value) || 0;
    if (statusStats[status]) {
      statusStats[status].count += 1;
      statusStats[status].sum += val;
    }
  });

  const revenueConfirmed = (statusStats['Aprovado']?.sum || 0) + (statusStats['Em execução']?.sum || 0) + (statusStats['Finalizado']?.sum || 0);
  const pipelineValue = (statusStats['Em elaboração']?.sum || 0) + (statusStats['Enviado']?.sum || 0);

  // Filtragem dos itens da lista
  const filteredLibrary = library.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        item.defaultText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'TODOS' || item.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* CABEÇALHO MODAL */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand" />
              <span>Catálogo de Produtos & Serviços</span>
            </h2>
            <p className="text-xs text-slate-400">Gerencie a biblioteca de itens padrões para a elaboração rápida de propostas.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div className="px-6 bg-slate-950/30 border-b border-slate-800 flex gap-4 shrink-0">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-3 px-1 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'products'
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-450 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Itens & Preços</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-1 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-450 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-1 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-450 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Configuração da Nuvem</span>
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="flex-1 overflow-hidden relative flex">
          
          {activeTab === 'products' && (
            <>
              {/* LISTA E FILTROS */}
              <div className={`flex-1 flex flex-col overflow-hidden p-6 space-y-4 transition-all duration-300 ${isFormOpen ? 'lg:pr-[390px]' : ''}`}>
                
                {/* BARRA DE AÇÕES E BUSCA */}
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between shrink-0">
                  <div className="relative w-full md:max-w-sm">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Pesquisar por nome ou descrição..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand/40 rounded-lg pl-9 pr-4 py-2 text-slate-200 text-xs outline-none transition"
                    />
                  </div>

                  <button
                    onClick={handleAddNewClick}
                    className="w-full md:w-auto px-4 py-2 rounded-lg text-xs font-bold bg-brand hover:bg-brand-hover text-slate-950 flex items-center justify-center gap-1.5 shadow-md shadow-brand/10 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Produto</span>
                  </button>
                </div>

                {/* FILTROS DE CATEGORIA */}
                <div className="flex flex-wrap gap-1.5 shrink-0 bg-slate-950/20 p-1 rounded-lg border border-slate-800/40">
                  <button
                    onClick={() => setSelectedCategory('TODOS')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      selectedCategory === 'TODOS'
                        ? 'bg-slate-800 text-brand'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    TODOS
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-slate-800 text-brand'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* TABELA DE ITENS */}
                <div className="flex-1 border border-slate-800/60 rounded-xl overflow-hidden bg-slate-950/20 flex flex-col">
                  <div className="overflow-y-auto flex-1">
                    {filteredLibrary.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-2">
                        <Info className="w-8 h-8 text-slate-700" />
                        <p className="text-xs font-semibold text-slate-400">Nenhum item encontrado</p>
                        <p className="text-[10px] text-slate-650">Crie um novo produto ou ajuste os filtros.</p>
                      </div>
                    ) : (
                      <table className="w-full border-collapse text-left text-xs text-slate-300">
                        <thead className="bg-slate-950/50 border-b border-slate-800 sticky top-0 text-slate-400 uppercase font-semibold text-[10px] tracking-wider">
                          <tr>
                            <th className="px-4 py-3">Produto / Serviço</th>
                            <th className="px-4 py-3 hidden md:table-cell">Texto Proposta (PDF)</th>
                            <th className="px-4 py-3 text-right">Medida</th>
                            <th className="px-4 py-3 text-right">Preço Ref.</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-4 py-3 text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {filteredLibrary.map(item => (
                            <tr 
                              key={item.id}
                              className={`hover:bg-slate-900/30 transition-all ${
                                editingId === item.id ? 'bg-brand/5 border-l-2 border-brand' : ''
                              } ${!item.active ? 'opacity-50' : ''}`}
                            >
                              <td className="px-4 py-3.5 max-w-[180px]">
                                <div className="font-bold text-slate-200 truncate">{item.name}</div>
                                <div className="text-[9px] text-brand/80 font-bold uppercase mt-0.5 tracking-wide">{item.category}</div>
                              </td>
                              <td className="px-4 py-3.5 hidden md:table-cell max-w-xs">
                                <p className="text-slate-500 line-clamp-2 leading-relaxed text-[11px]">{item.defaultText}</p>
                              </td>
                              <td className="px-4 py-3.5 text-right font-medium">
                                {item.unit ? (
                                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded text-[10px] font-bold">
                                    {item.unit}
                                  </span>
                                ) : (
                                  <span className="text-slate-600">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right font-semibold text-slate-200">
                                {formatCurrency(item.unitPrice)}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  item.active 
                                    ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-400' 
                                    : 'bg-slate-900 border border-slate-800 text-slate-500'
                                }`}>
                                  {item.active ? 'Ativo' : 'Inativo'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => handleEditClick(item)}
                                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition cursor-pointer"
                                    title="Editar"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick(item.id)}
                                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-red-400 rounded transition cursor-pointer"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

              </div>

              {/* DRAWER / PAINEL LATERAL FORMULÁRIO */}
              {isFormOpen && (
                <div className="absolute lg:relative right-0 top-0 bottom-0 w-full lg:w-[380px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-20 shrink-0">
                  <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-brand" />
                      <span>{editingId ? 'Editar Item' : 'Novo Cadastro'}</span>
                    </h3>
                    <button 
                      onClick={handleCancelEdit}
                      className="p-1 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-450 hover:text-white transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-left">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Categoria</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-brand/40 rounded-lg px-3 py-2 text-slate-200 text-xs outline-none transition cursor-pointer"
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Título / Nome Curto</label>
                      <input
                        type="text"
                        placeholder="Ex: Pintura interna acrílica"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-brand/40 rounded-lg px-3 py-2 text-slate-200 text-xs outline-none transition"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Unidade</label>
                        <input
                          type="text"
                          placeholder="Ex: m², un, dia"
                          value={formData.unit}
                          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-brand/40 rounded-lg px-3 py-2 text-slate-200 text-xs outline-none transition"
                        />
                        {/* Sugestões rápidas de unidade */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {unitSuggestions.map(sug => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => setFormData({ ...formData, unit: sug })}
                              className="text-[9px] bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-500 hover:text-slate-350 px-1 rounded transition cursor-pointer"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Preço Ref. (Unit.)</label>
                        <div className="relative">
                          <span className="text-[10px] text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 font-semibold">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={formData.unitPrice}
                            onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 focus:border-brand/40 rounded-lg pl-8 pr-3 py-2 text-slate-200 text-xs outline-none transition"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Texto Proposta (Aparece no PDF)</label>
                      <textarea
                        placeholder="Insira a descrição detalhada técnica deste serviço para colar automaticamente na proposta final..."
                        value={formData.defaultText}
                        onChange={(e) => setFormData({ ...formData, defaultText: e.target.value })}
                        rows="7"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-brand/40 rounded-lg p-3 text-slate-200 text-xs outline-none transition resize-none leading-relaxed font-sans"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        id="item-active-drawer"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="rounded border-slate-800 bg-slate-950 text-brand focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="item-active-drawer" className="text-xs text-slate-450 cursor-pointer select-none">
                        Item ativo para orçamento
                      </label>
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 py-2 px-4 rounded-lg bg-brand hover:bg-brand-hover text-slate-950 font-bold text-xs shadow-md shadow-brand/10 transition cursor-pointer"
                      >
                        {editingId ? 'Atualizar' : 'Salvar Cadastro'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="py-2 px-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-950/30 text-slate-400 hover:text-slate-200 text-xs font-semibold transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}

          {activeTab === 'dashboard' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-brand" />
                  <span>Painel Financeiro & Estatísticas</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Acompanhe a conversão de propostas, faturamento e pipeline comercial.</p>
              </div>

              {/* KPIS GERAIS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* CARD 1: RECEITA CONFIRMADA */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-brand/2">
                  <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-[0.03] text-brand pointer-events-none">
                    <CheckCircle className="w-32 h-32" />
                  </div>
                  <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Faturamento Confirmado</span>
                  <div className="text-2xl font-extrabold text-white mt-1.5 font-sans">
                    {formatCurrency(revenueConfirmed)}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-2">
                    <span className="font-semibold text-slate-350">
                      {(statusStats['Aprovado']?.count || 0) + (statusStats['Em execução']?.count || 0) + (statusStats['Finalizado']?.count || 0)}
                    </span>
                    <span>orçamentos fechados</span>
                  </div>
                </div>

                {/* CARD 2: PIPELINE COMERCIAL */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-yellow-500/2">
                  <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-[0.03] text-yellow-500 pointer-events-none">
                    <Sparkles className="w-32 h-32" />
                  </div>
                  <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Em Negociação (Em aberto)</span>
                  <div className="text-2xl font-extrabold text-white mt-1.5 font-sans">
                    {formatCurrency(pipelineValue)}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-2">
                    <span className="font-semibold text-slate-350">
                      {(statusStats['Em elaboração']?.count || 0) + (statusStats['Enviado']?.count || 0)}
                    </span>
                    <span>propostas pendentes</span>
                  </div>
                </div>

                {/* CARD 3: TOTAL HISTÓRICO */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-lg">
                  <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-[0.03] text-slate-400 pointer-events-none">
                    <Layers className="w-32 h-32" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total de Propostas Criadas</span>
                  <div className="text-2xl font-extrabold text-white mt-1.5 font-sans">
                    {formatCurrency(totalValue)}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-2">
                    <span className="font-semibold text-slate-350">{totalBudgets}</span>
                    <span>orçamentos no histórico</span>
                  </div>
                </div>

              </div>

              {/* DETALHAMENTO POR STATUS */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Desempenho por Status</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(statusStats).map(([status, data]) => (
                    <div 
                      key={status} 
                      className={`border rounded-xl p-4 flex flex-col justify-between space-y-2 ${data.bgClass}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${data.colorClass}`}>{status}</span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-950/40 px-2 py-0.5 rounded-full font-mono">
                          {data.count} {data.count === 1 ? 'orç.' : 'orçs.'}
                        </span>
                      </div>
                      
                      <div>
                        <span className="text-[10px] text-slate-505 block">Total Financeiro</span>
                        <span className="text-base font-extrabold text-slate-200 mt-0.5 block font-sans">
                          {formatCurrency(data.sum)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* DISTRIBUIÇÃO GRÁFICA VISUAL */}
              {totalValue > 0 && (
                <div className="bg-slate-950/20 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distribuição Financeira</h4>
                  
                  <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden flex">
                    {Object.entries(statusStats).map(([status, data]) => {
                      const pct = (data.sum / totalValue) * 100;
                      if (pct <= 0) return null;
                      
                      let barColor = "bg-slate-500";
                      if (status === 'Em elaboração') barColor = "bg-blue-500";
                      else if (status === 'Enviado') barColor = "bg-yellow-500";
                      else if (status === 'Aprovado') barColor = "bg-brand";
                      else if (status === 'Em execução') barColor = "bg-purple-500";
                      else if (status === 'Finalizado') barColor = "bg-slate-400";
                      else if (status === 'Recusado') barColor = "bg-red-500";

                      return (
                        <div 
                          key={status}
                          style={{ width: `${pct}%` }} 
                          className={`h-full ${barColor}`}
                          title={`${status}: ${pct.toFixed(1)}%`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-500">
                    {Object.entries(statusStats).map(([status, data]) => {
                      const pct = (data.sum / totalValue) * 100;
                      if (pct <= 0) return null;
                      
                      let dotColor = "bg-slate-500";
                      if (status === 'Em elaboração') dotColor = "bg-blue-500";
                      else if (status === 'Enviado') dotColor = "bg-yellow-500";
                      else if (status === 'Aprovado') dotColor = "bg-brand";
                      else if (status === 'Em execução') dotColor = "bg-purple-500";
                      else if (status === 'Finalizado') dotColor = "bg-slate-400";
                      else if (status === 'Recusado') dotColor = "bg-red-500";

                      return (
                        <div key={status} className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                          <span className="font-bold text-slate-350">{status}</span>
                          <span>({pct.toFixed(1)}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-6 max-w-3xl space-y-6 text-left">
              
              {/* SELETOR DE PROVEDOR DE SINCRONIZAÇÃO */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <Settings className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Provedor de Sincronização em Nuvem</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Escolha onde os orçamentos e itens do catálogo serão salvos. O Supabase é a solução profissional mais rápida e estável.
                    </p>
                  </div>
                </div>
                <div className="max-w-xs pt-1.5 pl-8">
                  <select
                    value={syncProvider}
                    onChange={(e) => handleSyncProviderChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-brand/40 rounded-lg px-3 py-2.5 text-slate-200 text-xs outline-none transition cursor-pointer"
                  >
                    <option value="local">Armazenamento Local (Apenas neste aparelho)</option>
                    <option value="sheets">Google Sheets (Planilha na Nuvem)</option>
                    <option value="supabase">Supabase Database (Banco de Dados em Nuvem)</option>
                  </select>
                </div>
              </div>
              
              {/* CARD 1: GOOGLE SHEETS */}
              <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Cloud className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Sincronização em Nuvem (Planilha Google)</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Conecte o seu sistema a uma Planilha Google no seu Drive. Isso permite que você edite seus orçamentos e biblioteca a partir de qualquer dispositivo (computador, celular ou tablet) de forma automática.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 max-w-xl">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-550">URL do Web App do Google Script</label>
                    <input
                      type="text"
                      placeholder="Cole o link do Google Script terminando em /exec..."
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand/40 rounded-lg px-3 py-2 text-slate-200 text-xs outline-none transition"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveApiUrl}
                      className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-slate-950 text-xs font-bold transition cursor-pointer shadow-md shadow-brand/5"
                    >
                      Salvar Conexão
                    </button>
                    {apiUrl && (
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="px-3 py-2 rounded-lg border border-slate-800 hover:border-red-900/50 hover:bg-red-950/20 text-slate-400 hover:text-red-400 text-xs font-semibold transition cursor-pointer"
                      >
                        Desconectar Planilha
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-xs text-brand/80 hover:text-brand underline cursor-pointer flex items-center gap-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{showInstructions ? "Ocultar passo a passo" : "Ver instruções passo a passo para conectar"}</span>
                  </button>
                  
                  {showInstructions && (
                    <div className="mt-3 bg-slate-950/60 border border-slate-850 rounded-xl p-4 text-xs text-slate-400 space-y-3 max-h-[300px] overflow-y-auto leading-relaxed">
                      <p className="font-bold text-slate-200">Como conectar o seu sistema ao Google Drive:</p>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>Crie uma nova Planilha Google vazia no seu Drive.</li>
                        <li>No menu superior, vá em <strong>Extensões &gt; Apps Script</strong>.</li>
                        <li>Apague qualquer código pré-existente e cole todo o conteúdo do arquivo <code>google_sync_script.js</code> (disponível na pasta do seu projeto).</li>
                        <li>Clique no disquete (Salvar) no topo do editor de script.</li>
                        <li>Clique no botão azul **Implantar &gt; Nova implantação** (canto superior direito).</li>
                        <li>Clique na engrenagem e selecione a opção **Aplicativo da Web**.</li>
                        <li>Configure exatamente assim:
                          <ul className="list-disc pl-5 mt-1 space-y-0.5">
                            <li><em>Executar como:</em> <strong>Você (seu e-mail)</strong></li>
                            <li><em>Quem tem acesso:</em> <strong>Qualquer pessoa (Anyone)</strong> *(Importante para os clientes aprovarem sozinhos)*</li>
                          </ul>
                        </li>
                        <li>Clique em **Implantar** e autorize o acesso à sua conta se o Google solicitar.</li>
                        <li>Copie o link gerado ("URL do aplicativo Web"), cole no campo de texto acima e clique em **Salvar Conexão**.</li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD: GOOGLE GEMINI API KEY */}
              <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Inteligência Artificial (Google Gemini)</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Insira sua Chave de API do Google Gemini para habilitar a importação automática de projetos em PDF.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 max-w-xl">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-550">Chave API do Gemini</label>
                    <input
                      type="password"
                      placeholder="Cole sua API Key do Gemini aqui..."
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand/40 rounded-lg px-3 py-2 text-slate-200 text-xs outline-none transition"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveGeminiKey}
                      className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-slate-950 text-xs font-bold transition cursor-pointer shadow-md shadow-brand/5"
                    >
                      Salvar Chave
                    </button>
                    {localStorage.getItem("jp_gemini_api_key") && (
                      <button
                        type="button"
                        onClick={handleDeleteGeminiKey}
                        className="px-3 py-2 rounded-lg border border-slate-800 hover:border-red-900/50 hover:bg-red-950/20 text-slate-400 hover:text-red-400 text-xs font-semibold transition cursor-pointer"
                      >
                        Remover Chave
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD: BANCO DE DADOS CLOUD (SUPABASE) */}
              <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Banco de Dados Supabase (Nuvem)</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Conecte seu sistema ao banco de dados Supabase para salvar e sincronizar seus dados de forma estável e em tempo real.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 max-w-xl">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-550">URL do Supabase (Project URL)</label>
                    <input
                      type="text"
                      placeholder="https://sua-id.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand/40 rounded-lg px-3 py-2 text-slate-200 text-xs outline-none transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-550">Supabase Anon Key (Chave pública)</label>
                    <input
                      type="password"
                      placeholder="Cole sua anon/public api key do Supabase..."
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand/40 rounded-lg px-3 py-2 text-slate-200 text-xs outline-none transition"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveSupabase}
                      className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-slate-950 text-xs font-bold transition cursor-pointer shadow-md shadow-brand/5"
                    >
                      Salvar Conexão Supabase
                    </button>
                    {localStorage.getItem("jp_supabase_url") && (
                      <button
                        type="button"
                        onClick={handleDisconnectSupabase}
                        className="px-3 py-2 rounded-lg border border-slate-800 hover:border-red-900/50 hover:bg-red-950/20 text-slate-400 hover:text-red-400 text-xs font-semibold transition cursor-pointer"
                      >
                        Desconectar Supabase
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CARD 2: MANUTENÇÃO */}
              <div className="bg-slate-950/30 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Manutenção da Biblioteca</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Se você cometer erros ou quiser apagar todas as customizações feitas nos itens padrões, você pode restaurar a biblioteca de fábrica contendo os 30+ serviços configurados originalmente.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  {showResetConfirm ? (
                    <div className="bg-red-950/15 border border-red-900/30 rounded-xl p-4 space-y-3 max-w-xl">
                      <p className="text-xs text-red-400 font-semibold leading-relaxed">
                        ⚠️ Atenção! Esta ação apagará TODOS os itens que você cadastrou ou editou e redefinirá os 30+ itens de fábrica. Os orçamentos que já foram salvos no histórico continuarão normais.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleResetLibrary}
                          className="px-4 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer"
                        >
                          Sim, restaurar fábrica
                        </button>
                        <button
                          onClick={() => setShowResetConfirm(false)}
                          className="px-3 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="py-2 px-4 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4 text-slate-500" />
                      <span>Restaurar Biblioteca de Fábrica</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
