import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, MapPin, Calendar, ClipboardList, Clock, CreditCard, DollarSign } from 'lucide-react';

export default function BudgetForm({ budget, onChange, section }) {
  const [localValue, setLocalValue] = useState(budget.value || '');
  const [desiredValue, setDesiredValue] = useState('');
  const prevBudgetId = useRef(budget.id);

  useEffect(() => {
    if (prevBudgetId.current !== budget.id) {
      setLocalValue(budget.value || '');
      setDesiredValue('');
      prevBudgetId.current = budget.id;
    }
  }, [budget.id, budget.value]);

  const handleApplyDesiredValue = (desiredVal) => {
    const valueNum = parseBrazilianNumber(desiredVal);
    if (!valueNum || valueNum <= 0) return;

    const currentTotal = budget.services?.reduce((sum, s) => sum + ((parseFloat(s.quantity) || 0) * (parseFloat(s.unitPrice) || 0)), 0) || 0;
    if (currentTotal === 0) {
      alert("Para aplicar o ajuste comercial, os serviços selecionados precisam ter quantidade e preço maiores que zero.");
      return;
    }

    const factor = valueNum / currentTotal;
    let accumulatedSum = 0;

    const updatedServices = budget.services.map((s, idx) => {
      const isLast = idx === budget.services.length - 1;
      let newUnitPrice = (parseFloat(s.unitPrice) || 0) * factor;
      let newSubtotal = (parseFloat(s.quantity) || 0) * newUnitPrice;

      newUnitPrice = parseFloat(newUnitPrice.toFixed(4));
      newSubtotal = parseFloat(((parseFloat(s.quantity) || 0) * newUnitPrice).toFixed(2));

      accumulatedSum += newSubtotal;

      if (isLast) {
        const diff = valueNum - accumulatedSum;
        if (Math.abs(diff) > 0.01) {
          newSubtotal += diff;
          if ((parseFloat(s.quantity) || 0) > 0) {
            newUnitPrice = parseFloat((newSubtotal / (parseFloat(s.quantity) || 0)).toFixed(4));
          }
        }
      }

      return {
        ...s,
        unitPrice: parseFloat(newUnitPrice.toFixed(2)),
        subtotal: parseFloat(newSubtotal.toFixed(2))
      };
    });

    onChange({
      ...budget,
      services: updatedServices,
      value: String(valueNum)
    });
    setLocalValue(String(valueNum));
  };

  const parseBrazilianNumber = (inputStr) => {
    if (!inputStr) return '';
    
    // Limpa espaços e o símbolo "R$"
    let clean = inputStr.replace(/R\$\s?/g, '').trim();
    
    // Se contém pontos e vírgulas (ex: 11.500,00)
    if (clean.includes('.') && clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(/,/g, '.');
    } 
    // Se contém apenas vírgulas (ex: 11500,00 ou 11,5)
    else if (clean.includes(',')) {
      clean = clean.replace(/,/g, '.');
    }
    // Se contém apenas pontos (ex: 11.500 ou 1.500.000 ou 11.50)
    else if (clean.includes('.')) {
      const parts = clean.split('.');
      const lastPart = parts[parts.length - 1];
      // Se houver múltiplos pontos ou se a última parte após o ponto tiver exatamente 3 dígitos
      if (parts.length > 2 || lastPart.length === 3) {
        clean = clean.replace(/\./g, '');
      }
    }
    
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? '' : parsed;
  };

  const handleValueChange = (valStr) => {
    setLocalValue(valStr);
    const parsed = parseBrazilianNumber(valStr);
    onChange({
      ...budget,
      value: parsed
    });
  };

  const handleValueBlur = () => {
    setLocalValue(budget.value || '');
  };

  const handleClientChange = (field, value) => {
    onChange({
      ...budget,
      client: {
        ...budget.client,
        [field]: value
      }
    });
  };

  const handleFieldChange = (field, value) => {
    onChange({
      ...budget,
      [field]: value
    });
  };

  const durationOptions = ["3 a 5 dias", "1 semana", "2 semanas", "3 semanas", "1 mês"];
  const paymentOptions = [
    "À vista na conclusão",
    "50% entrada + 50% conclusão",
    "30% entrada + saldo na entrega",
    "Parcelado",
    "Personalizado"
  ];

  return (
    <div className="space-y-6 text-slate-300">
      
      {/* SEÇÃO: DADOS DO ORÇAMENTO E STATUS */}
      {(!section || section === 'info') && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-brand" />
            <span>Informações do Orçamento</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nº do Orçamento</label>
              <input
                type="text"
                value={budget.id}
                disabled
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-3 py-2 text-slate-500 font-mono text-sm cursor-not-allowed"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Data de Emissão</label>
              <div className="relative w-full max-w-full overflow-hidden">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={budget.date}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  className="w-full min-w-0 bg-slate-950/80 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded-lg pl-9 pr-3 py-2 text-slate-200 text-sm outline-none transition"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Status</label>
              <select
                value={budget.status}
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none transition cursor-pointer"
              >
                <option value="Em elaboração">Em elaboração</option>
                <option value="Enviado">Enviado</option>
                <option value="Aprovado">Aprovado</option>
                <option value="Em execução">Em execução</option>
                <option value="Finalizado">Finalizado</option>
                <option value="Recusado">Recusado</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO: DADOS DO CLIENTE */}
      {(!section || section === 'client') && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-brand" />
            <span>Dados do Cliente</span>
          </h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nome do Cliente *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Nome completo ou Razão Social"
                    value={budget.client.name}
                    onChange={(e) => handleClientChange('name', e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded-lg pl-9 pr-3 py-2 text-slate-200 text-sm outline-none transition"
                    required
                  />
                </div>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="(47) 99999-9999"
                    value={budget.client.phone}
                    onChange={(e) => handleClientChange('phone', e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded-lg pl-9 pr-3 py-2 text-slate-200 text-sm outline-none transition"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Endereço da Obra</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Rua, Número, Bairro"
                    value={budget.client.address}
                    onChange={(e) => handleClientChange('address', e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded-lg pl-9 pr-3 py-2 text-slate-200 text-sm outline-none transition"
                  />
                </div>
              </div>

              <div className="min-w-0">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Cidade</label>
                <input
                  type="text"
                  placeholder="Ex: Rio do Sul - SC"
                  value={budget.client.city}
                  onChange={(e) => handleClientChange('city', e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Observações Adicionais do Cliente (Fica no topo do PDF)</label>
              <textarea
                placeholder="Ex: Pintura interna com urgência antes da mudança. Condomínio com restrição de horários."
                value={budget.client.notes}
                onChange={(e) => handleClientChange('notes', e.target.value)}
                rows="2"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none transition resize-y"
              ></textarea>
            </div>
          </div>
        </div>
      )}

      {/* SEÇÃO: CONDIÇÕES COMERCIAIS */}
      {(!section || section === 'values') && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-brand" />
            <span>Valores e Condições</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {budget.services && budget.services.some(s => s.quantity > 0) ? (
              <>
                <div className="min-w-0 col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Valor Total (Calculado)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-600 font-bold text-sm">R$</span>
                    <input
                      type="text"
                      disabled
                      value={parseFloat(budget.value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      className="w-full bg-slate-950/40 border border-slate-850 rounded-lg pl-9 pr-3 py-2 text-slate-500 font-bold text-base cursor-not-allowed outline-none"
                    />
                  </div>
                </div>

                <div className="min-w-0 col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <span>Valor Final Desejado</span>
                    <span className="text-[9px] text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.2 rounded font-bold uppercase">Ajuste Comercial</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-550 font-bold text-sm">R$</span>
                    <input
                      type="text"
                      placeholder="Redistribuir proporcional..."
                      value={desiredValue}
                      onChange={(e) => setDesiredValue(e.target.value)}
                      onBlur={() => handleApplyDesiredValue(desiredValue)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleApplyDesiredValue(desiredValue);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded-lg pl-9 pr-3 py-2 text-emerald-400 font-bold text-base outline-none transition"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="min-w-0 col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Valor Total do Orçamento *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-550 font-bold text-sm">R$</span>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={localValue}
                    onChange={(e) => handleValueChange(e.target.value)}
                    onBlur={handleValueBlur}
                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded-lg pl-9 pr-3 py-2 text-brand font-bold text-base outline-none transition"
                  />
                </div>
              </div>
            )}

            <div className="min-w-0 col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Prazo Estimado</label>
              <select
                value={budget.duration || ''}
                onChange={(e) => handleFieldChange('duration', e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none transition cursor-pointer"
              >
                <option value="">Selecione...</option>
                {durationOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400">Forma de Pagamento</label>
            <div className="flex flex-wrap gap-1.5">
              {paymentOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleFieldChange('payment', opt)}
                  className={`text-[11px] px-2.5 py-1.5 rounded-md border transition cursor-pointer ${
                    budget.payment === opt
                      ? 'bg-brand/10 border-brand text-brand font-medium'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Campo observações gerais do profissional */}
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Observações Finais / Termos do Orçamento (Fica no rodapé do PDF)</label>
            <textarea
              placeholder="Ex: Inclusos todos os materiais de preparação e fitas. Tinta será fornecida pelo cliente. Validade desta proposta: 15 dias."
              value={budget.notes || ''}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              rows="2"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-brand/50 focus:ring-1 focus:ring-brand/30 rounded-lg px-3 py-2 text-slate-200 text-sm outline-none transition resize-y"
            ></textarea>
          </div>
        </div>
      )}
      
    </div>
  );
}
