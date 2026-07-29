import React, { useState } from 'react';
import { X, Search, FileEdit, Copy, Printer, Trash2, FolderOpen, Calendar, Tag, MessageSquare, AlertCircle } from 'lucide-react';

export default function HistoryList({ 
  isOpen, 
  onClose, 
  budgets, 
  onLoadBudget, 
  onDuplicateBudget, 
  onDeleteBudget, 
  onPrintBudget 
}) {
  if (!isOpen) return null;

  const [searchTerm, setSearchTerm] = useState('');
  const [followUpBudget, setFollowUpBudget] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Todos');

  const getDaysElapsed = (dateString) => {
    if (!dateString) return 0;
    try {
      const cleanDate = dateString.split('T')[0].split(' ')[0];
      const parts = cleanDate.split('-');
      if (parts.length !== 3) return 0;
      const budgetDate = new Date(parts[0], parts[1] - 1, parts[2]);
      const today = new Date();
      budgetDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - budgetDate.getTime();
      return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    } catch (e) {
      return 0;
    }
  };

  const getWhatsAppLink = (phone, text) => {
    if (!phone) return '#';
    let cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length === 10 || cleanedPhone.length === 11) {
      cleanedPhone = '55' + cleanedPhone;
    } else if (!cleanedPhone.startsWith('55') && cleanedPhone.length >= 8) {
      cleanedPhone = '55' + cleanedPhone;
    }
    return `https://api.whatsapp.com/send?phone=${cleanedPhone}&text=${encodeURIComponent(text)}`;
  };

  // Filtragem dos orçamentos
  const filteredBudgets = budgets.filter(b => {
    if (selectedStatus !== 'Todos' && b.status !== selectedStatus) {
      return false;
    }
    const term = searchTerm.toLowerCase();
    const clientName = b.client?.name?.toLowerCase() || '';
    const id = b.id?.toLowerCase() || '';
    return clientName.includes(term) || id.includes(term);
  });

  // Contagem quantitativa por status
  const counts = {
    Todos: budgets.length,
    'Em elaboração': budgets.filter(b => b.status === 'Em elaboração').length,
    Enviado: budgets.filter(b => b.status === 'Enviado').length,
    Aprovado: budgets.filter(b => b.status === 'Aprovado').length,
    'Em execução': budgets.filter(b => b.status === 'Em execução').length,
    Finalizado: budgets.filter(b => b.status === 'Finalizado').length,
    Recusado: budgets.filter(b => b.status === 'Recusado').length,
  };

  const statuses = [
    { label: 'Todos', value: 'Todos', color: 'slate' },
    { label: 'Elaboração', value: 'Em elaboração', color: 'blue' },
    { label: 'Enviado', value: 'Enviado', color: 'yellow' },
    { label: 'Aprovado', value: 'Aprovado', color: 'brand' },
    { label: 'Execução', value: 'Em execução', color: 'purple' },
    { label: 'Finalizado', value: 'Finalizado', color: 'slate' },
    { label: 'Recusado', value: 'Recusado', color: 'red' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Em elaboração':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Enviado':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'Aprovado':
        return 'bg-brand/10 text-brand border-brand/30';
      case 'Em execução':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Finalizado':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'Recusado':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const cleanDate = dateString.split('T')[0].split(' ')[0];
      const parts = cleanDate.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        if (year.length === 4) {
          return `${day}/${month}/${year.slice(-2)}`;
        }
      }
      return dateString;
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl h-[75vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* CABEÇALHO MODAL */}
        <div className="px-6 py-4 border-b border-slate-850 flex justify-between items-center bg-slate-900">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-brand" />
              <span>Histórico de Orçamentos</span>
            </h2>
            <p className="text-xs text-slate-400">Carregue, duplique ou gerencie propostas criadas anteriormente.</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FILTROS DE STATUS COM CONTADOR */}
        <div className="px-6 py-2.5 bg-slate-900 border-b border-slate-850 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden select-none shrink-0">
          {statuses.map(s => {
            const isActive = selectedStatus === s.value;
            const count = counts[s.value] || 0;
            
            let activeClass = "";
            switch (s.color) {
              case 'blue':
                activeClass = "bg-blue-500/10 text-blue-400 border-blue-500/30";
                break;
              case 'yellow':
                activeClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
                break;
              case 'brand':
                activeClass = "bg-brand/10 text-brand border-brand/30";
                break;
              case 'purple':
                activeClass = "bg-purple-500/10 text-purple-400 border-purple-500/30";
                break;
              case 'red':
                activeClass = "bg-red-500/10 text-red-400 border-red-500/30";
                break;
              case 'slate':
              default:
                activeClass = "bg-slate-500/10 text-slate-400 border-slate-500/30";
                break;
            }

            return (
              <button
                key={s.value}
                onClick={() => setSelectedStatus(s.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer shrink-0 ${
                  isActive 
                    ? `${activeClass} shadow-sm` 
                    : "bg-slate-950/40 border-slate-850/60 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                }`}
              >
                <span>{s.label}</span>
                <span className={`h-4 flex items-center justify-center px-1.5 rounded-full text-[9px] font-bold ${
                  isActive
                    ? 'bg-slate-950/40 text-current'
                    : 'bg-slate-900 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* BARRA DE PESQUISA */}
        <div className="px-6 py-3 border-b border-slate-850/50 bg-slate-950/20">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
            <input
              type="text"
              placeholder="Pesquisar por cliente ou nº do orçamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 focus:border-brand/40 rounded-lg pl-10 pr-4 py-2 text-slate-200 text-xs outline-none transition"
            />
          </div>
        </div>

        {/* LISTAGEM DE HISTÓRICO */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredBudgets.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
              <FolderOpen className="w-12 h-12 text-slate-700" />
              <div>
                <p className="text-sm font-semibold text-slate-400">Nenhum orçamento encontrado</p>
                <p className="text-xs text-slate-600 mt-1">
                  {searchTerm ? 'Tente mudar o termo da busca' : 'Crie e salve seu primeiro orçamento.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredBudgets.map(b => (
                <div 
                  key={b.id} 
                  className="bg-slate-950/40 border border-slate-850/80 hover:border-slate-800 rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand uppercase">{b.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(b.status)}`}>
                        {b.status}
                      </span>
                      {b.status === "Enviado" && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          getDaysElapsed(b.date) >= 3 
                            ? 'bg-amber-950/40 border border-amber-800/40 text-amber-300' 
                            : 'bg-slate-900 border border-slate-800 text-slate-400'
                        }`}>
                          {getDaysElapsed(b.date) === 0 
                            ? 'Enviado hoje' 
                            : getDaysElapsed(b.date) === 1 
                              ? 'Enviado ontem' 
                              : `Enviado há ${getDaysElapsed(b.date)} dias`
                          }
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-200 truncate">{b.client?.name || 'Cliente Sem Nome'}</h4>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(b.date)}</span>
                      </span>
                      <span className="font-semibold text-brand/80">
                        {formatCurrency(b.value)}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1.5 sm:self-center shrink-0">
                    {b.status === "Enviado" && (
                      <button
                        onClick={() => setFollowUpBudget(b)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          getDaysElapsed(b.date) >= 3
                            ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-500/10'
                            : 'bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-750'
                        }`}
                        title="Acompanhar orçamento pendente"
                      >
                        {getDaysElapsed(b.date) >= 3 ? (
                          <AlertCircle className="w-3.5 h-3.5 text-white animate-pulse" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 text-brand" />
                        )}
                        <span>Cobrar</span>
                      </button>
                    )}

                    <button
                      onClick={() => onLoadBudget(b)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand/10 hover:bg-brand text-brand hover:text-slate-950 transition cursor-pointer"
                      title="Editar Orçamento"
                    >
                      <FileEdit className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    
                    <button
                      onClick={() => onDuplicateBudget(b.id)}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Duplicar Orçamento"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onPrintBudget(b)}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                      title="Gerar PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteBudget(b.id)}
                      className="p-2 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-red-400 transition cursor-pointer"
                      title="Excluir Orçamento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE ACOMPANHAMENTO / COBRANÇA */}
      {followUpBudget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl flex flex-col overflow-hidden shadow-2xl p-6 space-y-6">
            
            {/* Cabeçalho */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-bold text-brand uppercase tracking-wider">Acompanhamento Comercial</span>
                <h3 className="text-base font-bold text-white mt-0.5">Orçamento {followUpBudget.id}</h3>
                <p className="text-xs text-slate-400">Cliente: {followUpBudget.client?.name || 'Não informado'}</p>
              </div>
              <button 
                onClick={() => setFollowUpBudget(null)}
                className="p-1 rounded-lg bg-slate-950 border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Banner de alerta de dias passados */}
            <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-3.5 flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 shrink-0 mt-0.5 ${getDaysElapsed(followUpBudget.date) >= 3 ? 'text-amber-500' : 'text-slate-400'}`} />
              <div className="text-xs">
                <p className="text-slate-200 font-bold">
                  Status: Pendente há {getDaysElapsed(followUpBudget.date) === 0 ? '0 dias (Enviado hoje)' : `${getDaysElapsed(followUpBudget.date)} dias`}
                </p>
                <p className="text-slate-500 mt-1 leading-relaxed">
                  Utilize as abordagens abaixo para fazer o acompanhamento com o cliente de forma profissional e sem parecer invasivo.
                </p>
              </div>
            </div>

            {/* Abordagens */}
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
              
              {/* Abordagem 1 */}
              <div className="border border-slate-800/80 rounded-xl p-4 bg-slate-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">Abordagem 1: Check-in de dúvidas</span>
                  <span className="text-[9px] bg-slate-850 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-semibold">1 a 3 dias pós-envio</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  <strong>Estratégia:</strong> Foco em garantir que ele recebeu o orçamento e se colocar à disposição para tirar qualquer dúvida técnica de escopo.
                </p>
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 text-[11px] text-slate-350 select-text leading-relaxed font-sans border-dashed">
                  {`Olá, ${followUpBudget.client?.name || 'Cliente'}! Tudo bem? Passando para confirmar se você conseguiu receber e abrir o link exclusivo com a proposta para o seu imóvel (orçamento ${followUpBudget.id}). Ficou alguma dúvida sobre o escopo de preparação das superfícies ou sobre a execução das pinturas? Estou à disposição para detalhar qualquer ponto! Um abraço, Júlio Peixer.`}
                </div>
                <div className="flex gap-2">
                  <a
                    href={getWhatsAppLink(
                      followUpBudget.client?.phone,
                      `Olá, ${followUpBudget.client?.name || 'Cliente'}! Tudo bem? Passando para confirmar se você conseguiu receber e abrir o link exclusivo com a proposta para o seu imóvel (orçamento ${followUpBudget.id}). Ficou alguma dúvida sobre o escopo de preparação das superfícies ou sobre a execução das pinturas? Estou à disposição para detalhar qualquer ponto! Um abraço, Júlio Peixer.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-brand hover:bg-brand-hover text-slate-950 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Enviar no WhatsApp</span>
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Olá, ${followUpBudget.client?.name || 'Cliente'}! Tudo bem? Passando para confirmar se você conseguiu receber e abrir o link exclusivo com a proposta para o seu imóvel (orçamento ${followUpBudget.id}). Ficou alguma dúvida sobre o escopo de preparação das superfícies ou sobre a execução das pinturas? Estou à disposição para detalhar qualquer ponto! Um abraço, Júlio Peixer.`
                      );
                      alert("Mensagem da Abordagem 1 copiada!");
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 transition cursor-pointer"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              {/* Abordagem 2 */}
              <div className="border border-slate-800/80 rounded-xl p-4 bg-slate-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400">Abordagem 2: Urgência e Escassez</span>
                  <span className="text-[9px] bg-slate-850 border border-slate-800 px-2 py-0.5 rounded text-slate-400 font-semibold">5 a 7 dias pós-envio</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  <strong>Estratégia:</strong> Gatilho de agenda cheia e escassez. Indica que a agenda de obras está se organizando e oferece prioridade para fechar agora.
                </p>
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 text-[11px] text-slate-350 select-text leading-relaxed font-sans border-dashed">
                  {`Olá, ${followUpBudget.client?.name || 'Cliente'}! Espero que esteja tudo bem. Estava organizando meu cronograma de execução de pinturas para as próximas semanas e lembrei do seu projeto (orçamento ${followUpBudget.id}). Como prezamos por uma preparação de superfície minuciosa e de alta durabilidade, limitamos a quantidade de obras simultâneas para garantir a máxima qualidade. Você teria 5 minutinhos hoje ou amanhã para alinharmos os próximos passos ou ajustar alguma condição? Um abraço, Júlio Peixer.`}
                </div>
                <div className="flex gap-2">
                  <a
                    href={getWhatsAppLink(
                      followUpBudget.client?.phone,
                      `Olá, ${followUpBudget.client?.name || 'Cliente'}! Espero que esteja tudo bem. Estava organizando meu cronograma de execução de pinturas para as próximas semanas e lembrei do seu projeto (orçamento ${followUpBudget.id}). Como prezamos por uma preparação de superfície minuciosa e de alta durabilidade, limitamos a quantidade de obras simultâneas para garantir a máxima qualidade. Você teria 5 minutinhos hoje ou amanhã para alinharmos os próximos passos ou ajustar alguma condição? Um abraço, Júlio Peixer.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold bg-brand hover:bg-brand-hover text-slate-950 transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Enviar no WhatsApp</span>
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Olá, ${followUpBudget.client?.name || 'Cliente'}! Espero que esteja tudo bem. Estava organizando meu cronograma de execução de pinturas para as próximas semanas e lembrei do seu projeto (orçamento ${followUpBudget.id}). Como prezamos por uma preparação de superfície minuciosa e de alta durabilidade, limitamos a quantidade de obras simultâneas para garantir a máxima qualidade. Você teria 5 minutinhos hoje ou amanhã para alinharmos os próximos passos ou ajustar alguma condição? Um abraço, Júlio Peixer.`
                      );
                      alert("Mensagem da Abordagem 2 copiada!");
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 transition cursor-pointer"
                  >
                    Copiar
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
}
