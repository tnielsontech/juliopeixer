import React, { useState } from 'react';
import { CheckSquare, Square, Edit, RefreshCw, Layers } from 'lucide-react';

export default function ServicesSelector({ library, selectedServices, onChange, filterCategory }) {
  const categories = filterCategory 
    ? [filterCategory]
    : ["PREPARAÇÃO", "PINTURA", "REVESTIMENTOS", "EFEITOS DECORATIVOS", "EQUIPAMENTOS E DIFERENCIAIS"];

  // Mapeamento dos serviços selecionados por ID para busca rápida
  const selectedMap = selectedServices.reduce((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {});

  const handleToggleService = (item) => {
    const isSelected = !!selectedMap[item.id];
    let newSelected = [];

    if (isSelected) {
      // Remover
      newSelected = selectedServices.filter(s => s.id !== item.id);
    } else {
      // Adicionar cópia do padrão
      newSelected = [
        ...selectedServices,
        {
          id: item.id,
          name: item.name,
          category: item.category,
          text: item.defaultText, // copia o texto padrão da biblioteca
          unit: item.unit || undefined,
          unitPrice: item.unitPrice !== undefined ? item.unitPrice : undefined
        }
      ];
    }
    onChange(newSelected);
  };

  const handleQuantityChange = (id, value) => {
    const parsed = value === '' ? '' : parseFloat(value);
    const newSelected = selectedServices.map(s => {
      if (s.id === id) {
        const qty = isNaN(parsed) ? 0 : parsed;
        return { 
          ...s, 
          quantity: value === '' ? undefined : qty,
          subtotal: value === '' ? 0 : parseFloat((qty * (s.unitPrice || 0)).toFixed(2))
        };
      }
      return s;
    });
    onChange(newSelected);
  };

  const handleUnitChange = (id, value) => {
    const newSelected = selectedServices.map(s => {
      if (s.id === id) {
        return { ...s, unit: value };
      }
      return s;
    });
    onChange(newSelected);
  };

  const handleUnitPriceChange = (id, value) => {
    const parsed = value === '' ? '' : parseFloat(value);
    const newSelected = selectedServices.map(s => {
      if (s.id === id) {
        const price = isNaN(parsed) ? 0 : parsed;
        return { 
          ...s, 
          unitPrice: value === '' ? undefined : price,
          subtotal: value === '' ? 0 : parseFloat(((s.quantity || 0) * price).toFixed(2))
        };
      }
      return s;
    });
    onChange(newSelected);
  };

  const handleTextChange = (id, newText) => {
    const newSelected = selectedServices.map(s => {
      if (s.id === id) {
        return { ...s, text: newText };
      }
      return s;
    });
    onChange(newSelected);
  };

  const handleResetText = (id) => {
    const libraryItem = library.find(item => item.id === id);
    if (!libraryItem) return;

    const newSelected = selectedServices.map(s => {
      if (s.id === id) {
        return { ...s, text: libraryItem.defaultText };
      }
      return s;
    });
    onChange(newSelected);
  };

  // Filtra apenas itens ativos na biblioteca global
  const activeLibrary = library.filter(item => item.active);

  const filteredSelected = filterCategory 
    ? selectedServices.filter(s => s.category === filterCategory) 
    : selectedServices;

  return (
    <div className="space-y-6">
      
      {/* SELEÇÃO POR CHECKBOXES AGRUPADOS */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand" />
          <span>Biblioteca de Serviços (Selecione os itens)</span>
        </h3>

        <div className="space-y-6">
          {categories.map(category => {
            const categoryItems = activeLibrary.filter(item => item.category === category);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category} className="space-y-2.5">
                <h4 className="text-xs font-bold text-brand uppercase tracking-widest pl-1 border-l-2 border-brand/50">
                  {category}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {categoryItems.map(item => {
                    const isSelected = !!selectedMap[item.id];
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleService(item)}
                        className={`flex items-start text-left gap-2.5 p-3 rounded-lg border transition-all text-xs cursor-pointer ${
                          isSelected
                            ? 'bg-brand/5 border-brand/40 text-white shadow-sm shadow-brand/5'
                            : 'bg-slate-950/60 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        <span className="mt-0.5 shrink-0">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </span>
                        <span className="font-medium leading-relaxed">{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* EDICAO DE TEXTO DOS SERVIÇOS SELECIONADOS */}
      {filteredSelected.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Edit className="w-4 h-4 text-brand" />
            <span>Personalizar Textos para este Orçamento ({filteredSelected.length})</span>
          </h3>
          <p className="text-xs text-slate-500">
            * As alterações feitas abaixo afetam apenas este orçamento atual e não alteram as definições globais da biblioteca.
          </p>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {filteredSelected.map(service => {
              const originalItem = library.find(item => item.id === service.id);
              const isModified = originalItem && originalItem.defaultText !== service.text;

              return (
                <div key={service.id} className="bg-slate-950 border border-slate-850 rounded-lg p-4 space-y-2.5 relative">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold text-brand uppercase tracking-wider bg-slate-900 px-2 py-0.5 rounded border border-slate-850 mr-2">
                        {service.category}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">{service.name}</span>
                      {(service.unit || service.unitPrice !== undefined) && (
                        <span className="text-[10px] text-slate-500 ml-2 font-medium">
                          ({service.unitPrice !== undefined ? service.unitPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : ''}
                          {service.unit ? ` / ${service.unit}` : ''})
                        </span>
                      )}
                    </div>

                    {isModified && (
                      <button
                        type="button"
                        onClick={() => handleResetText(service.id)}
                        className="text-[10px] text-brand/80 hover:text-brand flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-850 hover:border-brand/30 transition cursor-pointer"
                        title="Restaurar descrição original da biblioteca"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reverter</span>
                      </button>
                    )}
                  </div>
                  <textarea
                    value={service.text}
                    onChange={(e) => handleTextChange(service.id, e.target.value)}
                    rows="3"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-brand/40 focus:ring-1 focus:ring-brand/20 rounded-md p-2.5 text-xs text-slate-300 outline-none transition resize-y"
                    placeholder="Escreva a descrição do serviço aqui..."
                  />

                  {/* NOVOS CAMPOS DE QUANTIDADE E VALORES */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2.5 border-t border-slate-900/60 mt-2.5">
                    <div className="min-w-0">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quantidade</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={service.quantity !== undefined ? service.quantity : ''}
                        onChange={(e) => handleQuantityChange(service.id, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none transition"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Unidade</label>
                      <input
                        type="text"
                        placeholder="m²"
                        value={service.unit || ''}
                        onChange={(e) => handleUnitChange(service.id, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none transition"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Preço Unitário</label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-[10px] text-slate-500 font-bold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={service.unitPrice !== undefined ? service.unitPrice : ''}
                          onChange={(e) => handleUnitPriceChange(service.id, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded pl-7 pr-2 py-1.5 text-xs text-slate-200 outline-none transition font-mono font-semibold"
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex flex-col justify-end text-right">
                      <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 font-sans">Subtotal</span>
                      <span className="text-xs font-bold text-brand py-1 font-mono">
                        {((service.quantity || 0) * (service.unitPrice || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </div>                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
